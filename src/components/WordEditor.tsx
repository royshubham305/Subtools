import React, { useState, useRef } from 'react';
import { Upload, Download, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export default function WordEditor() {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fontFamily, setFontFamily] = useState('Calibri');
  const [fontSize, setFontSize] = useState('11');
  const editorRef = useRef<HTMLDivElement>(null);

  // Handle file upload with improved conversion
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({
        arrayBuffer,
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "table => table:collapse"
        ],
        convertImage: mammoth.images.imgElement((image) => {
          return image.read("base64").then((base64) => ({
            src: "data:" + image.contentType + ";base64," + base64,
          }));
        })
      });

      const styledHtml = `
        <style>
          body { 
            font-family: Calibri, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.15;
            margin: 1in;
          }
          table { border-collapse: collapse; margin: 10pt 0; }
          td, th { border: 1px solid #ddd; padding: 4px; }
          h1 { font-size: 24pt; margin: 24pt 0; }
          h2 { font-size: 18pt; margin: 18pt 0; }
        </style>
        ${result.value}
      `;

      setContent(styledHtml);
      setFileName(file.name);
      if (editorRef.current) editorRef.current.innerHTML = styledHtml;
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error opening document. Please check file format.');
    }
  };

  // Formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const setHeading = (level: string) => {
    formatText('formatBlock', level === '0' ? '<p>' : `<h${level}>`);
  };

  // DOCX conversion logic
  const processNode = (node: ChildNode): TextRun[] => {
    const runs: TextRun[] = [];
    let currentText = '';
    let currentStyles: any = {};

    const traverse = (n: ChildNode) => {
      if (n.nodeType === Node.TEXT_NODE) {
        currentText += n.textContent;
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        const element = n as HTMLElement;

        // Handle styles
        const styles: any = {};
        if (element.style.fontWeight === 'bold' || element.tagName === 'STRONG' || element.tagName === 'B') {
          styles.bold = true;
        }
        if (element.style.fontStyle === 'italic' || element.tagName === 'EM' || element.tagName === 'I') {
          styles.italic = true;
        }
        if (element.style.textDecoration === 'underline' || element.tagName === 'U') {
          styles.underline = {};
        }

        // Handle font size
        const match = element.style.fontSize.match(/(\d+)pt/);
        if (match) styles.size = parseInt(match[1]) * 2;
        if (element.tagName === 'H1') styles.size = 48;
        if (element.tagName === 'H2') styles.size = 36;

        // Handle alignment
        if (element.style.textAlign) {
          styles.alignment = element.style.textAlign;
        }

        // Push current text
        if (currentText) {
          runs.push(new TextRun({ text: currentText, ...currentStyles }));
          currentText = '';
        }

        const previousStyles = { ...currentStyles };
        currentStyles = { ...currentStyles, ...styles };

        // Process children
        Array.from(element.childNodes).forEach(traverse);

        // Restore styles
        currentStyles = previousStyles;
      }
    };

    traverse(node);
    
    if (currentText) {
      runs.push(new TextRun({ text: currentText, ...currentStyles }));
    }

    return runs;
  };

  // Save to DOCX
  const handleSave = async () => {
    if (!editorRef.current) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(editorRef.current.innerHTML, 'text/html');
      
      const paragraphs = Array.from(doc.body.children).map(element => {
        const runs = processNode(element as ChildNode);
        
        // Handle lists
        if (element.tagName === 'UL' || element.tagName === 'OL') {
          return new Paragraph({
            numbering: {
              reference: element.tagName === 'UL' ? 'bullet' : 'numbered',
              level: 0
            },
            children: runs
          });
        }

        return new Paragraph({ children: runs });
      });

      const wordDoc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(wordDoc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName ? `edited-${fileName}` : 'document.docx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving document. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl">
          {/* Toolbar */}
          <div className="border-b border-gray-200 p-2">
            <div className="flex items-center gap-4 flex-wrap">
              {/* File Section */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="word-upload"
                />
                <label
                  htmlFor="word-upload"
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                  title="Open"
                >
                  <Upload className="w-5 h-5" />
                </label>
                <button
                  onClick={handleSave}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Save"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              {/* Font Section */}
              <div className="flex items-center gap-2 border-l pl-4">
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    setFontFamily(e.target.value);
                    formatText('fontName', e.target.value);
                  }}
                  className="p-1 border rounded"
                >
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                </select>
                <select
                  value={fontSize}
                  onChange={(e) => {
                    setFontSize(e.target.value);
                    formatText('fontSize', e.target.value);
                  }}
                  className="p-1 border rounded w-16"
                >
                  {[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              {/* Formatting Section */}
              <div className="flex items-center gap-2 border-l pl-4">
                <button 
                  onClick={() => formatText('bold')} 
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Bold"
                >
                  <Bold className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => formatText('italic')} 
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Italic"
                >
                  <Italic className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => formatText('underline')} 
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Underline"
                >
                  <Underline className="w-5 h-5" />
                </button>
              </div>

              {/* Paragraph Section */}
              <div className="flex items-center gap-2 border-l pl-4">
                <select
                  onChange={(e) => setHeading(e.target.value)}
                  className="p-1 border rounded"
                >
                  <option value="0">Normal Text</option>
                  <option value="1">Heading 1</option>
                  <option value="2">Heading 2</option>
                </select>
                <button 
                  onClick={() => formatText('justifyLeft')} 
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Align Left"
                >
                  <AlignLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => formatText('justifyCenter')} 
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Center"
                >
                  <AlignCenter className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => formatText('justifyRight')} 
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Align Right"
                >
                  <AlignRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => formatText('insertUnorderedList')} 
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Bullet List"
                >
                  <List className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => formatText('insertOrderedList')} 
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Numbered List"
                >
                  <ListOrdered className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Editor Area */}
          <div className="p-4">
            {!content ? (
              <div className="h-96 flex items-center justify-center text-gray-500">
                <label
                  htmlFor="word-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <Upload className="w-16 h-16" />
                  <span className="text-lg">Click to upload or start editing</span>
                </label>
              </div>
            ) : (
              <div
                ref={editorRef}
                contentEditable
                dangerouslySetInnerHTML={{ __html: content }}
                className="min-h-[70vh] p-4 border rounded focus:outline-none bg-white"
                style={{
                  fontFamily: fontFamily,
                  fontSize: `${fontSize}pt`,
                  lineHeight: '1.15',
                  margin: '1in',
                }}
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}