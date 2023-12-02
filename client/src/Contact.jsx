import Avatar from "./Avatar"

export default function Contact({id,username, onClick, selected, online}) {
    return(
        <div  key={id} onClick={() => onClick(id)} 
        className={"border-b border-gray-100 flex items-center gap-2 cursor-pointer " + (id === selected ? 'bg-gray-50' : '')}>
            {id === selected && (
                <div className="w-1 bg-gray-500 h-12 rounded-r-md"></div>
            )}
            <div className="flex gap-2 py-2 pl-4 items-center">
                <Avatar online={online} username={username} userId={id} />
                <span className="text-gray-800">{username}</span>
            </div>
        </div>
    )
}