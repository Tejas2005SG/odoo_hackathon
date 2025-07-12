
import { Route, Routes } from "react-router-dom"
import AskQuestion from "./pages/AskQuestion"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/ask-question" element={<div><AskQuestion/></div>} />
      </Routes>
    </>
  )
}

export default App

