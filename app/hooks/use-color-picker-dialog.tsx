import { useCallback, useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { useDebounce } from "./use-debounce";


export function useColorPickerDialog({
    ...props
}: Omit<ColorPickerDialogProps, 'isOpen' | 'setIsOpen'>) {

    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);

    const dialog = (
        <ColorPickerDialog {...props} isOpen={isOpen} setIsOpen={setIsOpen} />
    );

    return {
        handleOpen: open,
        colorPickerDialog: dialog
    }
}


type ColorPickerDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    color: string;
    onColorChange: (color: string) => void;
};

// Hex color validation
function isValidHex(hex: string) {
    return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(hex);
}

export default function ColorPickerDialog({
    isOpen, setIsOpen, color, onColorChange
}: ColorPickerDialogProps) {
    const [inputColor, setInputColor] = useState(color);
    const debouncedColor = useDebounce(inputColor, 100);

    // // Update color only if valid and debounced
    // useEffect(() => {
    //     if (isValidHex(debouncedColor)) {
    //         onColorChange(debouncedColor);
    //     }
    // }, [debouncedColor]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pick a color</DialogTitle>
                    <DialogDescription>
                        Choose a color from the palette or enter a hex value.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-row gap-3">
                    <HexColorPicker
                        color={inputColor}
                        onChange={(newColor) => setInputColor(newColor)}
                    />

                    <div>
                        Selecting color: <span className="font-bold">{debouncedColor}</span>
                        <div
                            className="size-32 rounded-full border mt-2"
                            style={{
                                backgroundColor: isValidHex(debouncedColor) ? debouncedColor : "#ffffff"
                            }}
                        />
                    </div>
                </div>

                <Input
                    placeholder="Enter hex value..."
                    type="text"
                    value={inputColor}
                    onChange={(e) => setInputColor(e.target.value)}
                />

                <DialogFooter>
                    <Button type="button" variant="default" onClick={() => {
                        if (isValidHex(debouncedColor)) {
                            onColorChange(debouncedColor);
                        }
                        setIsOpen(false)
                    }}>Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}