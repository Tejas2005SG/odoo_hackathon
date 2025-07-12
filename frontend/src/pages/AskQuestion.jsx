import React, { useState, useRef } from "react";
import { useAuthStore } from "../Store/auth.store.js"; // Adjust path as needed
import {
  Send,
  X,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Image,
  Smile,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Code,
  Quote
} from "lucide-react";

const AskQuestion = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const editorRef = useRef(null);

  // Get user from auth store
  const { user } = useAuthStore();
  const userId = user?.id;

  const commonEmojis = [
    "😀", "😊", "😂", "🤔", "😍", "🙄", "😢", "😮", "👍", "👎",
    "❤️", "🔥", "⭐", "✅", "❌", "⚠️", "💡", "🚀", "🎉", "🤝"
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const execCommand = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setTimeout(() => {
      setDescription(editorRef.current?.innerHTML || "");
    }, 0);
  };

  const handleEmojiClick = (emoji) => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current?.appendChild(document.createTextNode(emoji));
    }
    setShowEmojiPicker(false);
    setDescription(editorRef.current?.innerHTML || "");
  };

  const handleLinkInsert = () => {
    if (linkUrl && linkText) {
      editorRef.current?.focus();
      const link = document.createElement('a');
      link.href = linkUrl;
      link.textContent = linkText;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.color = '#2563eb';
      link.style.textDecoration = 'underline';
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(link);
        range.setStartAfter(link);
        range.setEndAfter(link);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current?.appendChild(link);
      }
      setDescription(editorRef.current?.innerHTML || "");
    }
    setShowLinkDialog(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Check if user is authenticated
      if (!user) {
        alert('Please log in to upload images');
        return;
      }

      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result;

        try {
          const response = await fetch('http://localhost:5000/api/ask-question/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for authentication
            body: JSON.stringify({ image: base64Image })
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || 'Failed to upload image');
          }

          editorRef.current?.focus();
          const img = document.createElement('img');
          img.src = data.secure_url;
          img.alt = file.name;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.display = 'block';
          img.style.margin = '10px 0';
          img.style.borderRadius = '8px';
          img.style.border = '1px solid #e5e7eb';

          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const br1 = document.createElement('br');
            range.insertNode(br1);
            range.insertNode(img);
            const br2 = document.createElement('br');
            range.insertNode(br2);
            range.setStartAfter(br2);
            range.setEndAfter(br2);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            editorRef.current?.appendChild(document.createElement('br'));
            editorRef.current?.appendChild(img);
            editorRef.current?.appendChild(document.createElement('br'));
          }

          setDescription(editorRef.current?.innerHTML || "");
        } catch (error) {
          console.log('Error uploading image: ', error);
          alert('Failed to upload image: ' + error.message);
        }
      };
      reader.onerror = () => {
        alert('Error reading image file');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleEditorInput = () => {
    setDescription(editorRef.current?.innerHTML || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      alert('Please log in to submit a question');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title,
      description,
      tags: JSON.stringify(tags),
      userId: userId // Include user ID in payload
    };

    try {
      const response = await fetch('http://localhost:5000/api/ask-question/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        alert('Question submitted successfully!');
        setTitle("");
        setDescription("");
        setTags([]);
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
      } else {
        alert(data.message || 'Failed to submit question');
      }
    } catch (error) {
      console.log('Error submitting question: ', error);
      alert('Failed to submit question: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show login message if user is not authenticated
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Ask a Question</h1>
        <p className="text-slate-600">Please log in to ask a question.</p>
      </div>
    );
  }

  const ToolbarButton = ({ onClick, children, title, active = false }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        active ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Ask a Question</h1>
        <p className="text-slate-600">Welcome, {user.firstName}!</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
            Question Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
            placeholder="What's your programming question? Be specific and concise."
          />
          <p className="text-sm text-slate-500">
            Good titles are specific and help others understand your question at a glance.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Question Description *
          </label>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden relative">
            <div className="bg-gray-50 p-2 border-b border-gray-200">
              <div className="flex flex-wrap gap-1 items-center">
                <ToolbarButton onClick={() => execCommand('bold')} title="Bold">
                  <Bold size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('italic')} title="Italic">
                  <Italic size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Strikethrough">
                  <Strikethrough size={16} />
                </ToolbarButton>
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                
                <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
                  <List size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered List">
                  <ListOrdered size={16} />
                </ToolbarButton>
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                
                <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Align Left">
                  <AlignLeft size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Align Center">
                  <AlignCenter size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyRight')} title="Align Right">
                  <AlignRight size={16} />
                </ToolbarButton>
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                
                <ToolbarButton onClick={() => execCommand('formatBlock', 'pre')} title="Code Block">
                  <Code size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('formatBlock', 'blockquote')} title="Quote">
                  <Quote size={16} />
                </ToolbarButton>
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                
                <ToolbarButton onClick={() => setShowLinkDialog(true)} title="Insert Link">
                  <Link size={16} />
                </ToolbarButton>
                
                <label className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer" title="Upload Image">
                  <Image size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                
                <div className="relative">
                  <ToolbarButton 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                    title="Insert Emoji"
                    active={showEmojiPicker}
                  >
                    <Smile size={16} />
                  </ToolbarButton>
                  
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
                      <div className="grid grid-cols-5 gap-1 w-48">
                        {commonEmojis.map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                            className="p-2 hover:bg-gray-100 rounded text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                
                <ToolbarButton onClick={() => execCommand('undo')} title="Undo">
                  <Undo size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('redo')} title="Redo">
                  <Redo size={16} />
                </ToolbarButton>
              </div>
            </div>
            
            <div
              ref={editorRef}
              contentEditable
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
              className="min-h-80 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset prose prose-sm max-w-none"
              style={{
                minHeight: '320px',
                lineHeight: '1.6',
                fontSize: '14px'
              }}
              suppressContentEditableWarning={true}
              data-placeholder="Provide detailed information about your question..."
            />
            
            {!description && (
              <div className="absolute top-16 left-4 text-gray-400 pointer-events-none">
                Provide detailed information about your question...
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Use the toolbar above to format your question</span>
            <span>{description.length} characters</span>
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="tags" className="block text-sm font-semibold text-slate-700">
            Tags
          </label>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <div 
                  key={index}
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-3">
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter a tag (e.g., javascript, react, css)"
              disabled={tags.length >= 5}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              disabled={!tagInput.trim() || tags.length >= 5}
            >
              Add Tag
            </button>
          </div>
          <p className="text-sm text-slate-500">
            {tags.length < 5 
              ? `Add up to ${5 - tags.length} more tags to help categorize your question` 
              : "Maximum 5 tags reached"}
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || !title.trim() || !description.trim()}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Posting Question...
            </>
          ) : (
            <>
              Post Your Question
              <Send className="w-5 h-5 ml-3" />
            </>
          )}
        </button>
      </form>

      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Display text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowLinkDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLinkInsert}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  disabled={!linkUrl.trim() || !linkText.trim()}
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AskQuestion;