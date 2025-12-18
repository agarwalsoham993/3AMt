import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMfFmWmIcWwVh3N2qSXv9VhVknvgdJsAY",
  authDomain: "am-thoughts-8943b.firebaseapp.com",
  projectId: "am-thoughts-8943b",
  storageBucket: "am-thoughts-8943b.firebasestorage.app",
  messagingSenderId: "944914733090",
  appId: "1:944914733090:web:2469d6f85fb837cc63927b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.checkPasscode = () => {
    const code = document.getElementById('passcode-input').value;
    if(code === "1906") { 
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        loadMessages();
    } else {
        alert("Wrong Code!");
    }
};

let mediaRecorder;
let audioChunks = [];
let audioBase64 = null; 

window.startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    
    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioChunks = [];
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
            audioBase64 = reader.result; // This looks like "data:audio/webm;base64,..."
            const preview = document.getElementById('preview-bubble');
            preview.classList.remove('hidden');
            preview.innerText = "🎤 Audio Ready!";
        };
    };
};

window.stopRecording = () => {
    if(mediaRecorder) mediaRecorder.stop();
};

window.sendMessage = async () => {
    const textInput = document.getElementById('text-input');
    const preview = document.getElementById('preview-bubble');
    const text = textInput.value;

    if(!text && !audioBase64) return;

    // Animation
    preview.classList.add('shooting');

    setTimeout(() => {
        preview.classList.remove('shooting');
        preview.classList.add('hidden');
        textInput.value = "";
    }, 600);

    // Save directly to Firestore (No Storage Bucket used)
    try {
        await addDoc(collection(db, "messages"), {
            text: text,
            audioData: audioBase64, // Saving the huge string directly
            timestamp: Date.now()
        });
        audioBase64 = null; // Clear after sending
    } catch (e) {
        console.error("Error sending:", e);
        alert("Message too big! Try a shorter audio.");
    }
};

function loadMessages() {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snapshot) => {
        const feed = document.getElementById('message-feed');
        feed.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const bubble = document.createElement('div');
            bubble.className = "bubble";
            
            let content = "";
            if(data.text) content += `<p>${data.text}</p>`;
            if(data.audioData) content += `<audio controls src="${data.audioData}"></audio>`;
            
            bubble.innerHTML = content;
            feed.appendChild(bubble);
        });
        feed.scrollTop = feed.scrollHeight;
    });
}
