import { type FetcherWithComponents, Form } from "@remix-run/react"
import { useRemixForm } from "remix-hook-form"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { toast } from "sonner"
import type React from "react"
import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import { fetchUpdateLevelMinimumGpa } from "~/lib/services/level"
import { Award, Save, AlertTriangle, Info } from "lucide-react"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { toastWarning } from "~/lib/utils/toast-utils"

// Define the schema for a single level's GPA
const levelGpaSchema = z.object({
    id: z.string(),
    name: z.string(),
    minimumGPA: z.coerce
        .number()
        .min(0, { message: "Minimum GPA must be ≥ 0" })
        .max(10, { message: "Minimum GPA must be ≤ 10" }),
})

// Schema for the entire form
export const levelGpaConfigSchema = z.object({
    levels: z.array(levelGpaSchema),
})

export type LevelGpaConfigFormData = z.infer<typeof levelGpaConfigSchema>

type Props = {
    fetcher: FetcherWithComponents<any>
    isSubmitting: boolean
    levels: any[]
    idToken: string
}

export default function LevelGpaConfigForm({ fetcher, isSubmitting, levels, idToken }: Props) {
    const [updatingLevels, setUpdatingLevels] = useState<Record<string, boolean>>({})
    const [hasChanges, setHasChanges] = useState(false)
    const [savingProgress, setSavingProgress] = useState(0)
    const [modifiedFields, setModifiedFields] = useState<Record<string, boolean>>({})
    const [originalValues, setOriginalValues] = useState<Record<string, number>>({})

    // Initialize original values
    useEffect(() => {
        const values: Record<string, number> = {}
        levels.forEach((level) => {
            values[level.id] = Number(level.minimumGPA)
        })
        setOriginalValues(values)
    }, [levels])

    const {
        formState: { errors, isDirty },
        register,
        getValues,
        watch,
    } = useRemixForm<LevelGpaConfigFormData & { module: string }>({
        mode: "onChange",
        resolver: zodResolver(
            levelGpaConfigSchema.extend({
                module: z.string(),
            }),
        ),
        defaultValues: {
            module: "levels",
            levels: levels.map((level) => ({
                id: level.id,
                name: level.name,
                minimumGPA: level.minimumGPA,
            })),
        },
    })

    const watchedLevels = watch("levels")

    // Improved change detection that only marks fields as modified when their values actually change
    const checkForChanges = () => {
        const newModifiedFields: Record<string, boolean> = {}
        let hasAnyChanges = false

        watchedLevels.forEach((level) => {
            const originalValue = originalValues[level.id]
            const currentValue = Number(level.minimumGPA)

            // Only mark as modified if the value has actually changed
            const isModified = originalValue !== currentValue

            if (isModified) {
                newModifiedFields[level.id] = true
                hasAnyChanges = true
            } else {
                newModifiedFields[level.id] = false
            }
        })

        setModifiedFields(newModifiedFields)
        return hasAnyChanges
    }

    // Handle form submission
    const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const formData = getValues()
        const updatedLevels = { ...updatingLevels }
        let successCount = 0
        let errorCount = 0

        // Find levels with changes
        const levelsWithChanges = formData.levels.filter((level) => {
            return modifiedFields[level.id]
        })

        if (levelsWithChanges.length === 0) {
            toast.info("No changes were made")
            return
        }

        for (let i = 0; i < levelsWithChanges.length; i++) {
            const level = levelsWithChanges[i]
            try {
                updatedLevels[level.id] = true
                setUpdatingLevels(updatedLevels)

                // Update progress
                setSavingProgress(Math.round(((i + 1) / levelsWithChanges.length) * 100))

                await fetchUpdateLevelMinimumGpa({
                    idToken,
                    levelId: level.id,
                    minimumGpa: level.minimumGPA,
                })
                successCount++

                // Update original values after successful save
                setOriginalValues((prev) => ({
                    ...prev,
                    [level.id]: Number(level.minimumGPA),
                }))

                updatedLevels[level.id] = false
                setUpdatingLevels(updatedLevels)
            } catch (error) {
                console.error(`Failed to update level ${level.id}:`, error)
                updatedLevels[level.id] = false
                setUpdatingLevels(updatedLevels)
                errorCount++
            }
        }

        if (successCount > 0) {
            toast.success(`Successfully updated ${successCount} level${successCount > 1 ? "s" : ""}`)

            // Clear modified fields for successfully updated levels
            const newModifiedFields = { ...modifiedFields }
            levelsWithChanges.forEach((level) => {
                newModifiedFields[level.id] = false
            })
            setModifiedFields(newModifiedFields)

            // Check if there are any remaining changes
            const stillHasChanges = Object.values(newModifiedFields).some(Boolean)
            setHasChanges(stillHasChanges)
        }

        if (errorCount > 0) {
            toastWarning(`Failed to update ${errorCount} level${errorCount > 1 ? "s" : ""}`)
        }

        // Reset progress
        setTimeout(() => setSavingProgress(0), 500)
    }

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: "Confirm GPA Requirements Update",
        description:
            "Are you sure you want to save these minimum GPA requirements for all levels? This will affect student level eligibility.",
        onConfirm: () => {
            const formElement = document.getElementById("level-gpa-form") as HTMLFormElement
            if (formElement) {
                handleFormSubmit({ preventDefault: () => { } } as FormEvent<HTMLFormElement>)
            }
        },
    })

    // Immediate change detection on input change
    const handleInputChange = (levelId: string, index: number) => {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            const currentValue = Number(e.target.value)
            const originalValue = originalValues[levelId]

            // Update modified fields immediately
            setModifiedFields((prev) => ({
                ...prev,
                [levelId]: currentValue !== originalValue,
            }))

            // Check for any changes and update state
            setTimeout(() => {
                const anyChanges = Object.values(modifiedFields).some(Boolean) || currentValue !== originalValue
                setHasChanges(anyChanges)
            }, 0)
        }
    }

    // Update hasChanges whenever modifiedFields changes
    useEffect(() => {
        const anyChanges = Object.values(modifiedFields).some(Boolean)
        setHasChanges(anyChanges)
    }, [modifiedFields])

    // Initial check for changes
    useEffect(() => {
        setHasChanges(checkForChanges())
    }, [watchedLevels])

    const isSaving = isSubmitting || Object.values(updatingLevels).some(Boolean)

    return (
        <>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    Level Minimum GPA Requirements
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Configure the minimum GPA (Grade Point Average) requirements for each piano level. Students must achieve at
                    least this GPA to qualify for the level.
                </p>
            </div>

            {isSaving && savingProgress > 0 && (
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Saving changes...</span>
                        <span>{savingProgress}%</span>
                    </div>
                    <Progress value={savingProgress} className="h-2" />
                </div>
            )}

            <Form id="level-gpa-form" onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                <input type="hidden" {...register("module")} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {levels.map((level, index) => {
                        const isUpdating = updatingLevels[level.id]
                        const hasWarning = errors?.levels && errors.levels[index] && errors.levels[index]?.minimumGPA ? true : false
                        const isModified = modifiedFields[level.id] || false

                        return (
                            <Card
                                key={level.id}
                                className={`border transition-all ${isUpdating ? "opacity-70" : ""} ${isModified ? "ring-2 ring-offset-1 ring-slate-200 dark:ring-slate-800" : ""
                                    } ${hasWarning ? "border-amber-200 dark:border-amber-900" : ""}`}
                            >
                                <CardHeader
                                    className="pb-2 relative"
                                    style={{
                                        background: `linear-gradient(to right, ${level.themeColor || "#888"}22, transparent)`,
                                        borderLeft: `4px solid ${level.themeColor || "#888"}`,
                                    }}
                                >
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg font-bold">{level.name}</CardTitle>
                                        {isModified && (
                                            <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800">
                                                Modified
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex flex-col gap-4">
                                        <input type="hidden" {...register(`levels.${index}.id`)} />
                                        <input type="hidden" {...register(`levels.${index}.name`)} />

                                        <div className="flex flex-row items-center gap-3">
                                            <Label className="w-[40%] flex items-center font-medium">
                                                <Award className="h-4 w-4 mr-2 text-slate-500" />
                                                Minimum GPA:
                                            </Label>
                                            <div className="relative flex-1">
                                                <Input
                                                    {...register(`levels.${index}.minimumGPA`, {
                                                        onChange: handleInputChange(level.id, index),
                                                    })}
                                                    placeholder="Enter GPA..."
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="10"
                                                    className={`${hasWarning ? "border-amber-500 focus-visible:ring-amber-500" : ""} ${isModified ? "bg-amber-50 dark:bg-amber-950/20" : ""
                                                        }`}
                                                    disabled={isUpdating}
                                                />
                                            </div>
                                        </div>

                                        {hasWarning && errors?.levels && errors.levels[index]?.minimumGPA && (
                                            <div className="text-amber-600 dark:text-amber-500 text-sm flex items-center gap-1 mt-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                <span>{errors.levels[index].minimumGPA.message}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="mt-6 flex items-center gap-4">
                    <Button
                        type="button"
                        variant="default"
                        className="gap-2"
                        isLoading={isSaving}
                        disabled={isSaving || !hasChanges}
                        onClick={handleOpenConfirmDialog}
                    >
                        {!isSaving && <Save className="h-4 w-4" />}
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>

                    {hasChanges && !isSaving && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Info className="h-4 w-4" />
                            You have unsaved changes
                        </p>
                    )}
                </div>
            </Form>
            {confirmDialog}
        </>
    )
}
