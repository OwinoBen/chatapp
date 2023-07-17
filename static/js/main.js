/**
 * Variables
 */

let chatName = ''
let chatSocket = null
let chatWindowUrl = window.location.href
let chatRoom_id = Math.random().toString(36).slice(2,12)


/**
 * Elements
 */

const chatElement = document.querySelector('#chat')
const chatOpenElement = document.querySelector('#open_chat')
const chatJoinElement = document.querySelector('#join_chat')
const chatIconElement = document.querySelector('#chat_icon')
const chatWelcomeElement = document.querySelector('#wel_chat')
const chatRoomElement = document.querySelector('#chat_room')
const chatNameElement = document.querySelector('#chat_name')
const chatInputElement = document.querySelector('#chat_message_input')
const chatLogElement = document.querySelector('#chat_log')
const chatSubmitElement = document.querySelector('#chat_message_submit')


/**
 * Functions
 */

// Enable scrolling when receiving or sending message
scrollToBottom = (()=>{
    chatLogElement.scrollTop = chatLogElement.scrollHeight
})

getCookie = ((name)=>{
    let cookieValue = null

    if (document.cookie && document.cookie !== ''){
        let cookies = document.cookie.split(';')

        for (let i=0; i<cookies.length; i++){
            let cookie = cookies[i].trim()

            if (cookie.substring(0, name.length + 1) === (name + '=')){
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1))

                break
            }
        }
    }

    return cookieValue
})

sendMessage = (() =>{
    chatSocket.send(JSON.stringify({
        'type': 'message',
        'message': chatInputElement.value,
        'name': chatName
    }))

    chatInputElement.value = ''
})

onChatMessage = ((data)=>{
    console.log(data)

    if (data.type === 'chat_message'){
        // temporary info variable to hold typing status
            let tmpInfo = document.querySelector('.tmp-info')

            if (tmpInfo){
                tmpInfo.remove()
            }
        if (data.agent){
            chatLogElement.innerHTML += `
                <div class="flex w-full mt-2 space-x-3 max-w-md">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2">${data.initials}</div>
                    <div>
                        <div class="bg-gray-300 p-3 rounded-l-lg rounded-br-lg">
                            <p class="text-sm">${data.message}</p>  
                        </div>
                        <span class="text-xs text-gray-500 leading-none">${data.created_at} ago</span>
                    </div>
                    
                </div>
            `
        }else {
            chatLogElement.innerHTML += `
                <div class="flex w-full mt-2 space-x-3 max-w-md ml-auto justify-end">
                    <div>
                        <div class="bg-blue-300 p-3 rounded-l-lg rounded-br-lg">
                            <p class="text-sm">${data.message}</p>  
                        </div>
                        <span class="text-xs text-gray-500 leading-none">${data.created_at} ago</span>
                    </div>
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2">${data.initials}</div>
                </div>
            `
        }
    }else if (data.type === 'users_update'){
        // update when the admin has joined the conversation
        chatLogElement.innerHTML += '<p class="mt-2">The admin/agent has joined the chat.</p>'
    }else if (data.type === 'writing_active'){
        if (data.agent){
            // temporary info variable to hold typing status
            let tmpInfo = document.querySelector('.tmp-info')

            if (tmpInfo){
                tmpInfo.remove()
            }
            chatLogElement.innerHTML += `
                <div class="tmp-info flex w-full mt-2 space-x-3 max-w-md">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2">${data.initials}</div>
                    <div>
                        <div class="bg-gray-300 p-3 rounded-l-lg rounded-br-lg">
                            <p class="text-sm">${data.message}</p>  
                        </div>
                    </div>
                    
                </div>
            `
        }
    }
    scrollToBottom()
})
   joinChatRoom =  (async () =>{
       console.log("join chat room")
       chatName = chatNameElement.value

       console.log('Join as', chatName)
       console.log('Room Id', chatRoom_id)

       const data = new FormData()
       data.append('name', chatName)
       data.append('url', chatWindowUrl)

       await fetch(`/api/create-room/${chatRoom_id}/`,{
           method: 'POST',
           headers:{
               'X-CSRFToken': getCookie('csrftoken')
           },
           body:data
       }).then((res) =>{
           return res.json()
       }).then((data)=>{
               console.log("data", data)
           })
       chatSocket = new WebSocket(`ws://${window.location.host}/ws/chat/${chatRoom_id}/`)

       chatSocket.onmessage = ((e)=>{
           console.log('onMessage', e.data)
           onChatMessage(JSON.parse(e.data))
       })

       chatSocket.onopen = ((e)=>{
           console.log("onOpen - chat socket was opened")
           scrollToBottom()
       })

       chatSocket.onclose = ((e)=>{
           console.log("onClose - chat socket was closed")
       })
   })



/**
 * Event listeners
 */

chatOpenElement.onclick = ((e) =>{
    e.preventDefault()

    chatIconElement.classList.add('hidden') //hide the chat icon
    chatWelcomeElement.classList.remove('hidden')

    return false
})

chatJoinElement.onclick = ((e) =>{
    e.preventDefault()

    chatWelcomeElement.classList.add('hidden') //hide the chat icon
    chatRoomElement.classList.remove('hidden')

    joinChatRoom()
    return false
})

chatSubmitElement.onclick = ((e)=>{
    e.preventDefault()
    sendMessage()
})

// Enable sending message when enter key is hit
chatInputElement.onkeyup = ((e)=>{
    //Enter key on the keyboard is code number 13
    if (e.keyCode === 13){
        sendMessage()
    }
})

chatInputElement.onfocus = ((e)=>{
    chatSocket.send(JSON.stringify(
        {
            'type': 'update',
            'message': 'The client is typing...',
            'name': chatName,
        }
    ))
})