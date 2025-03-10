import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Strikethrough, Italic, List, ListOrdered, Images } from "lucide-react";
import { Toggle } from "./ui/toggle";
import { Separator } from "./ui/separator";
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { useImagesDialog } from "~/hooks/use-images-dialog";
import { useEffect } from "react";
import ImageResize from 'tiptap-extension-resize-image';

type RichTextEditorProps = {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    minHeight?: number,
    allowImages?: boolean
}

const RichTextEditor = ({
    placeholder,
    value,
    onChange,
    minHeight = 300,
    allowImages = true
}: RichTextEditorProps) => {

    const editor = useEditor({
        editorProps: {
            attributes: {
                class:
                    `resize-y overflow-y-auto w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50`,
                style: `min-height: ${minHeight}px`,
            },
        },
        extensions: [
            StarterKit.configure({
                orderedList: {
                    HTMLAttributes: {
                        class: "list-decimal pl-4",
                    },
                },
                bulletList: {
                    HTMLAttributes: {
                        class: "list-disc pl-4",
                    },
                }
            }),
            Placeholder.configure({
                placeholder
            }),
            Image,
            ImageResize
        ],

        content: value, // Set the initial content with the provided value
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML()); // Call the onChange callback with the updated HTML content
        },
    });
    useEffect(() => {
        if (editor && editor.getHTML() !== value) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);
    
    return (
        <>
            {editor ? <RichTextEditorToolbar editor={editor} allowImages={allowImages} /> : null}
            <EditorContent editor={editor} />
        </>
    );
};
type RichTextEditorToolbarProps = {
    editor: Editor,
    allowImages: boolean
}

const RichTextEditorToolbar = ({ editor, allowImages }: RichTextEditorToolbarProps) => {

    const { open: openImagesDialog, dialog: imagesDialog } = useImagesDialog({
        onConfirm: (imageUrls) => {
            console.log({ imageUrls });

            const url = imageUrls[0];

            editor.chain().focus().setImage({ src: url }).run()
        },
        requiresUpload: true
    });

    return (
        <div className="border border-input bg-transparent mb-1 rounded-md shadow-sm p-1 flex flex-row items-center gap-1">
            <FormatType editor={editor} />
            <Toggle
                size="sm"
                pressed={editor.isActive("bold")}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
            >
                <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive("italic")}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            >
                <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive("strike")}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            >
                <Strikethrough className="h-4 w-4" />
            </Toggle>
            <Separator orientation="vertical" className="w-[1px] h-8" />
            <Toggle
                size="sm"
                pressed={editor.isActive("bulletList")}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            >
                <List className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive("orderedList")}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            >
                <ListOrdered className="h-4 w-4" />
            </Toggle>
            <Separator orientation="vertical" className="w-[1px] h-8" />
            {
                allowImages && (
                    <>
                        <Button type="button" size={'icon'} variant={'outline'} className="h-4 w-4 m-2" onClick={openImagesDialog}>
                            <Images className="h-4 w-4" />
                        </Button>
                        {imagesDialog}
                    </>
                )
            }

        </div>
    );
};

export default RichTextEditor;

type FormatTypeProps = {
    editor: Editor;
}

function FormatType({ editor }: FormatTypeProps) {

    const getCurrentFormat = () => {

        if (editor.isActive("heading", { level: 1 })) return "h1"
        if (editor.isActive("heading", { level: 2 })) return "h2"
        if (editor.isActive("heading", { level: 3 })) return "h3"
        if (editor.isActive("heading", { level: 4 })) return "h4"
        if (editor.isActive("heading", { level: 5 })) return "h5"
        if (editor.isActive("heading", { level: 6 })) return "h6"
        return "paragraph"
    }

    const setFormat = (format: string) => {
        editor.chain().focus()

        switch (format) {
            case "h1":
            case "h2":
            case "h3":
            case "h4":
            case "h5":
            case "h6":
                editor.chain().toggleHeading({ level: parseInt(format.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6 }).run()
                break
            case "paragraph":
            default:
                editor.chain().setParagraph().run()
        }
    }

    return (
        <Select onValueChange={setFormat} value={getCurrentFormat()}>
            <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Chọn kiểu chữ" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectItem value="paragraph">Văn bản</SelectItem>
                    <SelectItem value="h1">Tiêu đề 1</SelectItem>
                    <SelectItem value="h2">Tiêu đề 2</SelectItem>
                    <SelectItem value="h3">Tiêu đề 3</SelectItem>
                    <SelectItem value="h4">Tiêu đề 4</SelectItem>
                    <SelectItem value="h5">Tiêu đề 5</SelectItem>
                    <SelectItem value="h6">Tiêu đề 6</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}