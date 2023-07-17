/**
 * Variables
 */

// get room_id from  the javascript json_scripts
const chatRoom_id = document.querySelector('#room_id').textContent.replaceAll('"', '')
let chatSocket = null

/**
 * Elements from html
 */


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

sendMessage = (() =>{
    chatSocket.send(JSON.stringify({
        'type': 'message',
        'message': chatInputElement.value,
        'name': document.querySelector('#user_name').textContent.replaceAll('"', ''),
        'agent': document.querySelector('#user_id').textContent.replaceAll('"', '')
    }))

    chatInputElement.value = ''
})

onChatMessage = ((data)=>{
    console.log(data)

    if (data.type === 'chat_message'){
        // temporary info variable to hold typing status
            let tmpInfo = document.querySelector('.tmp-info')

            if (tmpInfo) {
                tmpInfo.remove()
            }
        if (!data.agent){
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
    }else if (data.type === 'writing_active') {
        if (!data.agent) {
            // temporary info variable to hold typing status
            let tmpInfo = document.querySelector('.tmp-info')

            if (tmpInfo) {
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

/**
 * Web socket
 */

chatSocket = new WebSocket(`ws://${window.location.host}/ws/chat/${chatRoom_id}/`)

chatSocket.onmessage = ((e)=>{
    console.log('on message')
    onChatMessage(JSON.parse(e.data))
})

chatSocket.onopen = ((e)=>{
    console.log('on open')
    scrollToBottom()
})

chatSocket.onclose = ((e)=>{
    console.log('chat socket closed unexpectedly')
})

/**
 * Event listeners
 */

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
            'message': 'Agent is typing...',
            'name': document.querySelector('#user_name').textContent.replaceAll('"', ''),
            'agent': document.querySelector('#user_id').textContent.replaceAll('"', '')
        }
    ))
})