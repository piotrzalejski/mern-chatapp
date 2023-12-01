import { useEffect, useState } from "react"
import Avatar from "./Avatar"

export default function Chat() {
    const [ws, setWs] = useState(null)
    const [onlinePeople, setOnlnePeople] = useState({})
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:4005')
        setWs(ws)
        ws.addEventListener('message', handleMessage )
    }, [])
    function showOnlinePeeps(peopleArr){
        const people = {}
        peopleArr.forEach(({userId, username}) => {
            people[userId] = username
        })
        console.log(people)
        setOnlnePeople(people)
    }
    function handleMessage(ev){
        const messageData = JSON.parse(ev.data)
        if ('online' in messageData){
            showOnlinePeeps(messageData.online)
        }
    }
    /**
     * left chats/people
     * middle conversation
     * bott form for message + send button
     */
    return (

        <div className="flex h-screen">
            <div className="bg-white w-1/3 p-2 pl-4 pt-4">
                <div className="text-blue-600 font-bold flex gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 015 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914z" />
                        <path d="M14 6c-.762 0-1.52.02-2.271.062C10.157 6.148 9 7.472 9 8.998v2.24c0 1.519 1.147 2.839 2.71 2.935.214.013.428.024.642.034.2.009.385.09.518.224l2.35 2.35a.75.75 0 001.28-.531v-2.07c1.453-.195 2.5-1.463 2.5-2.915V8.998c0-1.526-1.157-2.85-2.729-2.936A41.645 41.645 0 0014 6z" />
                    </svg>


                    MernChat
                </div>
                {Object.keys(onlinePeople).map(userId=> (
                    <div className="border-b border-gray-100 py-2 flex items-center gap-2 cursor-pointer">
                        <Avatar username={onlinePeople[userId]} userId={userId} />
                        <span className="text-gray-800">{onlinePeople[userId]}</span>
                    </div>
                ))}
            </div>
            <div className=" flex flex-col bg-gray-50 w-2/3 p-2">
                <div className="flex-grow">Messages with selected person</div>
                <div className="flex gap-2">
                    <input type="text" 
                        placeholder="Type your message here: " 
                        className="bg-white border p-2 flex-grow rounded-md" />
                    <button className="bg-blue-500 p-2 text-white rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}