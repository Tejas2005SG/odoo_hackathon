import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { axiosInstance } from '../Store/auth.store.js';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar.jsx';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { useAuthStore } from '../Store/auth.store.js';
import {
  ThumbsUp,
  ThumbsDown,
  Send,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Image,
  Smile,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Code,
  Quote,
  X,
} from 'lucide-react';

const AnswerQuestion = ({ mobileMenuOpen = false }) => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answerContent, setAnswerContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const editorRef = useRef(null);
  const { user } = useAuthStore();

  const commonEmojis = [
    '😀', '😊', '😂', '🤔', '😍', '🙄', '😢', '😮', '👍', '👎',
    '❤️', '🔥', '⭐', '✅', '❌', '⚠️', '💡', '🚀', '🎉', '🤝',
  ];

  useEffect(() => {
    if (!id) {
      setLoading(false);
      toast.error('Invalid question ID');
      return;
    }

    const fetchQuestionAndAnswers = async () => {
      try {
        const questionResponse = await axiosInstance.get(`/ask-question/${id}`);
        const answersResponse = await axiosInstance.get(`/ask-question/${id}/answers`);
        setQuestion(questionResponse.data);
        setAnswers(answersResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching question or answers:', error);
        toast.error(error.response?.data?.message || 'Failed to load data');
        setLoading(false);
      }
    };
    fetchQuestionAndAnswers();
  }, [id]);

  const execCommand = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setTimeout(() => {
      setAnswerContent(editorRef.current?.innerHTML || '');
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
    setAnswerContent(editorRef.current?.innerHTML || '');
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
      setAnswerContent(editorRef.current?.innerHTML || '');
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      if (!user) {
        toast.error('Please log in to upload images');
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result;
        try {
          const response = await axiosInstance.post('/ask-question/upload-image', {
            image: base64Image,
          });
          const data = response.data;

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

          setAnswerContent(editorRef.current?.innerHTML || '');
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error(error.response?.data?.message || 'Failed to upload image');
        }
      };
      reader.onerror = () => {
        toast.error('Error reading image file');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleEditorInput = () => {
    setAnswerContent(editorRef.current?.innerHTML || '');
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to answer');
      return;
    }
    if (!answerContent.trim()) {
      toast.error('Answer content is required');
      return;
    }

    try {
      const response = await axiosInstance.post('/ask-question/answer', {
        questionId: id,
        content: answerContent,
      });
      setAnswers([...answers, response.data.answer]);
      setAnswerContent('');
      if (editorRef.current) editorRef.current.innerHTML = '';
      toast.success('Answer submitted successfully');
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error(error.response?.data?.message || 'Failed to submit answer');
    }
  };

  const handleVote = async (answerId, voteType) => {
    if (!user) {
      toast.error('Please log in to vote');
      return;
    }
    try {
      const response = await axiosInstance.post('/ask-question/vote', { answerId, voteType });
      setAnswers(
        answers.map((a) => (a._id === answerId ? response.data.answer : a))
      );
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error updating vote:', error);
      toast.error(error.response?.data?.message || 'Failed to update vote');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar onMobileMenuToggle={(isOpen) => {}} />
        <div
          className={`max-w-6xl mx-auto p-6 transition-all duration-300 pt-28 md:pt-36 ${
            mobileMenuOpen ? 'pt-96 md:pt-48' : 'pt-28 md:pt-36'
          }`}
        >
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar onMobileMenuToggle={(isOpen) => {}} />
        <div
          className={`max-w-6xl mx-auto p-6 transition-all duration-300 pt-28 md:pt-36 ${
            mobileMenuOpen ? 'pt-96 md:pt-48' : 'pt-28 md:pt-36'
          }`}
        >
          <p className="text-center text-gray-500 text-lg">Question not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onMobileMenuToggle={(isOpen) => {}} />
      <div
        className={`max-w-6xl mx-auto p-6 transition-all duration-300 pt-28 md:pt-36 ${
          mobileMenuOpen ? 'pt-96 md:pt-48' : 'pt-28 md:pt-36'
        }`}
      >
        <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Questions
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">{question.title}</h1>
        <div className="prose prose-lg max-w-none mb-6">
          {parse(DOMPurify.sanitize(question.description))}
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Asked by {question.user?.username || 'Unknown'} on{' '}
          {new Date(question.createdAt).toLocaleDateString()}
        </p>

        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Answers</h2>
        {answers.length === 0 ? (
          <p className="text-gray-500">No answers yet. Be the first to answer!</p>
        ) : (
          <div className="space-y-6">
            {answers.map((answer) => (
              <div key={answer._id} className="bg-white p-4 rounded-lg shadow-md">
                <div className="prose prose-sm max-w-none mb-2">
                  {parse(DOMPurify.sanitize(answer.content))}
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Answered by {answer.user?.username || 'Unknown'} on{' '}
                  {new Date(answer.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleVote(answer._id, 'upvote')}
                    className="flex items-center gap-1 text-green-600 hover:text-green-800"
                  >
                    <ThumbsUp size={16} /> {answer.upvotes}
                  </button>
                  <button
                    onClick={() => handleVote(answer._id, 'downvote')}
                    className="flex items-center gap-1 text-red-600 hover:text-red-800"
                  >
                    <ThumbsDown size={16} /> {answer.downvotes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Your Answer</h2>
        <form onSubmit={handleSubmitAnswer} className="space-y-4">
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
                fontSize: '14px',
              }}
              suppressContentEditableWarning={true}
              data-placeholder="Write your answer here..."
            />
            {!answerContent && (
              <div className="absolute top-16 left-4 text-gray-400 pointer-events-none">
                Write your answer here...
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Use the toolbar above to format your answer</span>
            <span>{answerContent.length} characters</span>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!answerContent.trim() || !user || loading}
          >
            <Send className="w-5 h-5 mr-2" /> Submit Answer
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
    </div>
  );
};

export default AnswerQuestion;