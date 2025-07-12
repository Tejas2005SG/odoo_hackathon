"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Trash2, User, Mail, Tag, Clock, Users, MessageSquare, Loader2 } from "lucide-react"
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await axios.get("http://localhost:5000/api/auth/getuser", { withCredentials: true })
        const questionsRes = await axios.get("http://localhost:5000/api/ask-question/getallquestions", {
          withCredentials: true,
        })
        setUsers(usersRes.data.users)
        setQuestions(questionsRes.data.questions)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const deleteUserFromView = (userId) => {
    setUsers(users.filter((user) => user.id !== userId))
    setQuestions(questions.filter((q) => q.user?.id !== userId))
  }

  const deleteQuestionFromView = (questionId) => {
    setQuestions(questions.filter((q) => q.id !== questionId))
  }

  const getUserQuestions = (userId) => {
    return questions.filter((q) => q.user?.id === userId)
  }

  // Function to modify image size in the description HTML
  const adjustImageSize = (html) => {
    return html.replace(/<img[^>]*>/g, (imgTag) => {
      return imgTag.replace(
        /style="[^"]*"/,
        'style="max-width: 150px; height: auto; display: block; margin: 0 auto;"'
      )
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 mb-11">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Manage users and their questions</p>
              </div>
              <div className="flex items-center space-x-6">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 mr-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Home
                </Link>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <Users className="h-4 w-4" mr-3/>
                    <span className="mr-3">{users.length} Users</span>
                  </div>
                  <div className="flex items-center space-x-2 mr-3">
                    <MessageSquare className="h-4 w-4 mr-3" />
                    <span>{questions.length} Questions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding some users to the system.</p>
            </div>
          ) : (
            users.map((user) => {
              const userQuestions = getUserQuestions(user.id)
              return (
                <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* User Header */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center hover:h-16 hover:w-16 transition-all duration-300 ease-in-out cursor-pointer hover:shadow-lg hover:bg-gray-300">
                          <User className="h-4 w-4 text-gray-600 hover:h-8 hover:w-8 transition-all duration-300" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </h2>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteUserFromView(user.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete User
                      </button>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">First Name:</span>
                        <span className="text-sm font-medium text-gray-900">{user.firstName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Last Name:</span>
                        <span className="text-sm font-medium text-gray-900">{user.lastName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="text-sm font-medium text-gray-900">{user.email}</span>
                      </div>
                    </div>

                    {/* Questions Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Questions ({userQuestions.length})</h3>
                      </div>

                      {userQuestions.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">No questions posted yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {userQuestions.map((question) => (
                            <div
                              key={question.id}
                              className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-150"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-base font-semibold text-gray-900">{question.title}</h4>
                                    <button
                                      onClick={() => deleteQuestionFromView(question.id)}
                                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Delete
                                    </button>
                                  </div>

                                  <div
                                    className="text-sm text-gray-700 mb-3 prose prose-sm"
                                    dangerouslySetInnerHTML={{ __html: adjustImageSize(question.description) }}
                                  />

                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                      <Tag className="h-3 w-3" />
                                      <span>Tags: {question.tags.join(", ")}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>Status: {question.status}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard