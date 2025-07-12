import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../Store/auth.store.js';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/Navbar.jsx';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';

const truncateDescription = (html, maxLength = 100) => {
  const plainText = DOMPurify.sanitize(html).replace(/<[^>]+>/g, '');
  return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
};

const Homepage = ({ mobileMenuOpen = false }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        let url = '/ask-question/all';
        if (filter === 'new') {
          url = '/ask-question/all?sort=createdAt';
        } else if (filter === 'unanswered') {
          url = '/ask-question/all?unanswered=true';
        } else if (filter === 'popular') {
          url = '/ask-question/all?sort=views';
        }
        const response = await axiosInstance.get(url);
        console.log('Fetched questions:', response.data);
        setQuestions(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast.error(error.response?.data?.message || 'Failed to load questions');
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [filter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setLoading(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 mt-20 pt-20">
      <Navbar onMobileMenuToggle={(isOpen) => {}} />
      <div
        className={`max-w-6xl mx-auto p-6 transition-all duration-300 ${
          mobileMenuOpen ? 'pt-80 md:pt-36' : 'pt-28 md:pt-36'
        }`}
      >
        <div className="flex justify-between items-center mt-20">
          <h1 className="text-3xl font-bold text-slate-800">All Questions</h1>
          {/* <div className="flex space-x-4">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-accent text-primary' : 'bg-secondary text-text-primary'} hover:bg-accent/80 transition-colors`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('new')}
              className={`px-4 py-2 rounded-lg ${filter === 'new' ? 'bg-accent text-primary' : 'bg-secondary text-text-primary'} hover:bg-accent/80 transition-colors`}
            >
              New
            </button>
            <button
              onClick={() => handleFilterChange('unanswered')}
              className={`px-4 py-2 rounded-lg ${filter === 'unanswered' ? 'bg-accent text-primary' : 'bg-secondary text-text-primary'} hover:bg-accent/80 transition-colors`}
            >
              Unanswered
            </button>
            <button
              onClick={() => handleFilterChange('popular')}
              className={`px-4 py-2 rounded-lg ${filter === 'popular' ? 'bg-accent text-primary' : 'bg-secondary text-text-primary'} hover:bg-accent/80 transition-colors`}
            >
              Popular
            </button>
            <Link
              to="/ask-question"
              className="bg-gradient-to-r from-accent to-accent-secondary text-primary px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-accent/25 transition-all font-semibold"
            >
              Ask a Question
            </Link>
          </div> */}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : questions.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">No questions found. Be the first to ask!</p>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <div
                key={question._id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  {question._id ? (
                    <Link to={`/answer-qs/${question._id}`} className="text-blue-600 hover:underline">
                      {question.title}
                    </Link>
                  ) : (
                    <span className="text-red-600">Invalid Question (No ID)</span>
                  )}
                </h2>
                <div className="prose prose-sm max-w-none mb-4 text-gray-600">
                  {parse(DOMPurify.sanitize(truncateDescription(question.description)))}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Asked by {question.user?.username || 'Unknown'} on{' '}
                  {new Date(question.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;