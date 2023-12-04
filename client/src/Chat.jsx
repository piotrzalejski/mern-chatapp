import { useContext, useEffect, useRef, useState } from "react"
import Avatar from "./Avatar"
import Logo from "./Logo"
import { UserContext } from "./UserContext"
import { uniqBy } from 'lodash'
import axios from "axios"
import Contact from "./Contact"

export default function Chat() {
    const [ws, setWs] = useState(null)
    const [onlinePeople, setOnlnePeople] = useState({})
    const [offlinePeople, setOfflinePeople] = useState({})
    const [selectedUserId, setSelectedUserId] = useState(null)
    const [newMessageText, setNewMessageText] = useState('')
    const [messages, setMessages] = useState([])
    const {username, id, setId, setUsername} = useContext(UserContext)
    const messageBoxRef = useRef()
    useEffect(() => {
        connectToWs()
    }, [])
    function connectToWs(){
        const ws = new WebSocket('ws://localhost:4005')
        setWs(ws)
        ws.addEventListener('message', handleMessage )
        ws.addEventListener('close', () => {
            setTimeout(() =>{
                console.log('Disconnected. Trying to reconnect.')
                connectToWs()
            }, 1000)
        })
    }
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
        console.log({ev, messageData})
        if ('online' in messageData){
            showOnlinePeeps(messageData.online)
        } else {
            if (messageData.sender === selectedUserId) {
                setMessages(prev => ([...prev, {...messageData}]))
            }
        }
    }
    function sendMessage(ev, file = null){
        if (ev) ev.preventDefault()
        //console.log('sending')
        ws.send(JSON.stringify({
            recipient: selectedUserId,
            text: newMessageText,
            file
        }))
        setNewMessageText('')
        setMessages(prev => ([...prev, {
            text: newMessageText, 
            sender: id,
            recipient: selectedUserId,
            _id: Date.now()
        }]))
        if (file) {
            axios.get('/messages/'+ selectedUserId).then(res => {
                setMessages(res.data)
            })
        }
    }
    function logout(){
        axios.post('/logout').then(() => {
            setWs(null)
            setId(null)
            setUsername(null)
        })
    }
    function sendFile(ev){
        const reader = new FileReader()
        reader.readAsDataURL(ev.target.files[0])
        reader.onload = () =>{
            sendMessage(null, {
                name: ev.target.files[0].name,
                data: reader.result
            })
        }
    }

    useEffect(() => {
        const div = messageBoxRef.current
        if (div) {
            div.scrollIntoView({behavior: 'smooth', block: 'end', inline: 'nearest'})
            //div.scrollTop = div.scrollHeight
        }
    }, [messages])

    useEffect(() => {
        if (selectedUserId){
            axios.get('/messages/'+ selectedUserId).then(res => {
                setMessages(res.data)
            })
        }
    }, [selectedUserId])

    useEffect(() => {
        axios.get('/people').then(res => {
            const offlinePeopleArr = res.data
                .filter(p => p._id !== id)
                .filter(p => !Object.keys(onlinePeople).includes(p._id))
            const offlinePeople = {}
            offlinePeopleArr.forEach(p => {
                offlinePeople[p._id] = p
            })
            setOfflinePeople(offlinePeople)
        })
    }, [onlinePeople])

    const  onlinePeopleMinusUser = {...onlinePeople}
    delete onlinePeopleMinusUser[id]

    const messagesWithoutDupes = uniqBy(messages, '_id')
    /**
     * left chats/people
     * middle conversation
     * bott form for message + send button
     */
    return (

        <div className="flex h-screen">
            <div className="bg-white w-1/3 flex flex-col">
                <div className="flex-grow">
                    <Logo />
                    {Object.keys(onlinePeopleMinusUser).map(userId=> (
                        <Contact 
                            key={userId}
                            id={userId} 
                            username={onlinePeopleMinusUser[userId]}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId}
                            online={true} />
                    ))}
                    {Object.keys(offlinePeople).map(userId=> (
                        <Contact
                            key={userId} 
                            id={userId} 
                            username={offlinePeople[userId].username}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId}
                            online={false} />
                    ))}
                </div>
                <div className="p-2 text-center flex items-center justify-center">
                    <span className="mr-2 text-sm text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" />
                        </svg>
                        {username}
                        </span>
                    <button 
                        onClick={logout}
                        className="text-sm text-gray-500 bg-gray-100 py-1 px-2 border rounded-md hover:bg-gray-200">Logout</button>
                </div>
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
                    {!!selectedUserId && (
                        <div className="relative h-full">
                            <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                                {messagesWithoutDupes.map(message => (
                                    <div key={message._id} className={(message.sender === id ? "text-right" : "text-left")}>
                                        <div className={"inline-block text-left p-2 my-2 text-sm rounded-md max-w-md " + (message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}>
                                            {message.text}
                                            {message.file && (
                                                <div><a className="border-b" href={axios.defaults.baseURL + '/uploads/' + message.file}>{message.file}</a></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            <div ref={messageBoxRef}></div>
                            </div>
                        </div>
                    )}
                </div>
                {!!selectedUserId && (
                <form className="flex gap-2" onSubmit={sendMessage}>
                    <input type="text" 
                        value={newMessageText}
                        onChange={ev => setNewMessageText(ev.target.value)}
                        placeholder="Type your message here: " 
                        className="bg-white border p-2 flex-grow rounded-md" />
                    <label type="button" className="bg-gray-200 p-2 rounded-md border border-gray-300">
                        <input type="file" className="hidden cursor-pointer" onChange={sendFile}/>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
                        </svg>
                    </label>
                    <button type="submit" className="bg-blue-500 p-2 text-white rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                        </svg>
                    </button>
                </form>
                )}
            </div>
        </div>
    )
}