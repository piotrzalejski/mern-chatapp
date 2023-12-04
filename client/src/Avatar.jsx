export default function Avatar({userId,username,online}){
    const colors = ['bg-teal-200','bg-red-200', 'bg-purple-200',
                    'bg-green-200', 'bg-pink-200', 'bg-yellow-200',
                    'bg-orange-200', 'bg-cyan-200', 'bg-lime-200',
                    'bg-gray-200', 'bg-amber-200']
    const userIdBase10 = parseInt(userId, 16)
    const colorIndex = userIdBase10 % colors.length
    console.log(colorIndex)
    const color = colors[colorIndex]
    return(
        <div className={"w-8 h-8 relative rounded-full flex items-center " + color}>
            <div className="text-center w-full opacity-70">{username[0]}</div>
            <div className={"absolute w-3 h-3 bottom-0 right-0 rounded-full border border-white " + (online ? "bg-lime-500" : "bg-gray-500")}></div>
        </div>
    )
}