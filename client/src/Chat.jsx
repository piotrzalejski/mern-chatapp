import { useContext, useEffect, useState } from "react"
import Avatar from "./Avatar"
import Logo from "./Logo"
import { UserContext } from "./UserContext"

export default function Chat() {
    const [ws, setWs] = useState(null)
    const [onlinePeople, setOnlnePeople] = useState({})
    const [selectedUserId, setSelectedUserId] = useState(null)
    const {username, id} = useContext(UserContext)
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

    const  onlinePeopleMinusUser = {...onlinePeople}
    delete onlinePeopleMinusUser[id]
    /**
     * left chats/people
     * middle conversation
     * bott form for message + send button
     */
    return (

        <div className="flex h-screen">
            <div className="bg-white w-1/3">
                <Logo />
                {Object.keys(onlinePeopleMinusUser).map(userId=> (
                    <div  key={userId} onClick={() => setSelectedUserId(userId)} 
                    className={"border-b border-gray-100 flex items-center gap-2 cursor-pointer " + (userId === selectedUserId ? 'bg-gray-50' : '')}>
                        {userId === selectedUserId && (
                            <div className="w-1 bg-gray-500 h-12 rounded-r-md"></div>
                        )}
                        <div className="flex gap-2 py-2 pl-4 items-center">
                            <Avatar username={onlinePeople[userId]} userId={userId} />
                            <span className="text-gray-800">{onlinePeople[userId]}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className=" flex flex-col bg-gray-50 w-2/3 p-2">
                <div className="flex-grow">
                    {!selectedUserId && (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-gray-400">
                                &larr; Select a user from the sidebar
                            </div>
                        </div>
                    )}
                </div>
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