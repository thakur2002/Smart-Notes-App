import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

const RichTextEditor = ({ initialContent, onChange, readOnly }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'my-1',
          },
        },
        heading: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Bold,
      Italic,
      Underline,
      BulletList,
      OrderedList,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-700 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
        'data-placeholder': 'Start typing...',
      },
    },
  });

  // Handle editor initialization and content updates
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
      
      // Only update content if it's different from current editor state
      const currentContent = editor.getHTML();
      if (initialContent !== currentContent) {
        editor.commands.setContent(initialContent || '');
      }
    }
  }, [editor, initialContent, readOnly]);

  if (!editor) {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm min-h-[300px]">
        <div className="prose max-w-none min-h-[300px] p-2" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      {!readOnly && (
        <div className="flex flex-wrap gap-2 mb-4 border-b pb-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 ${editor.isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            • List
          </button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className={`prose max-w-none min-h-[300px] p-2 ${
          readOnly ? 'bg-gray-50' : 'bg-white'
        }`}
      />
    </div>
  );
};

export default RichTextEditor;