import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const QuestionScreen = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/questions/${id}`);
        setQuestion(data);
      } catch (err) {
        setError("Failed to load question.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id]);

  if (loading) return <div className="text-white p-6">Loading...</div>;
  if (error) return <div className="text-red-500 p-6">{error}</div>;
  if (!question) return <div className="text-white p-6">No question found.</div>;

  return (
    <div className="text-white p-8 max-w-4xl mx-auto">
      <div className="text-sm text-blue-400 mb-2">
        Question &gt; {question.title?.slice(0, 25)}...
      </div>

      <h1 className="text-2xl font-bold mb-2">{question.title}</h1>

      <div className="flex flex-wrap gap-2 my-2">
        {question.tags.map((tag, idx) => (
          <span
            key={idx}
            className="bg-gray-700 px-2 py-1 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="text-md mb-6">{question.description}</p>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Answers</h2>

        <div className="bg-gray-800 p-4 rounded-md mb-3">
          <p>The || Operator.</p>
          <p>The + Operator.</p>
          <p>The CONCAT Function.</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-md">
          <p>Details</p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg mb-2">Submit Your Answer</h2>
        <textarea
          className="w-full p-3 rounded-md bg-gray-900 text-white border border-gray-600"
          placeholder="Write your answer here..."
          rows={4}
        ></textarea>
        <button className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-md mt-3">
          Submit
        </button>
      </div>
    </div>
  );
};

export default QuestionScreen;