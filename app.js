// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAa_ZVk_m6aXXm8ygCKNd0EQtaQZDMnBrg",
    authDomain: "music-site-d1baf.firebaseapp.com",
    projectId: "music-site-d1baf",
    storageBucket: "music-site-d1baf.firebasestorage.app",
    messagingSenderId: "813329988297",
    appId: "1:813329988297:web:79347fd497edb8a5562b18",
    databaseURL: "https://music-site-d1baf-default-rtdb.firebaseio.com"
};

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = "u3elvi6g";
const CLOUDINARY_UPLOAD_PRESET = "magic_music";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Session Management
let sessionActive = false;
let sessionTimeout;
let adminMode = false;
let clickCounter = 0;
const ADMIN_CLICKS = 7;

// Music Player Variables
let currentTrackIndex = -1;
let isPlaying = false;
let musicList = [];
const audio = document.getElementById('audioPlayer');

// ======================
// LOGIN FUNCTIONALITY
// ======================

function checkPassword() {
    const password = document.getElementById('passwordInput').value;
    
    db.ref('settings/operatorPassword').once('value', (snapshot) => {
        const storedPassword = snapshot.val() || "Music@123";
        
        if (password === storedPassword) {
            sessionActive = true;
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('playerPage').style.display = 'block';
            loadMusicList();
            loadInstructions();
            resetSessionTimeout();
        } else {
            document.getElementById('errorMsg').textContent = "❌ Incorrect Password!";
            document.getElementById('passwordInput').value = "";
            document.getElementById('passwordInput').focus();
        }
    });
}

function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
        if (sessionActive) {
            logout();
        }
    }, 30 * 60 * 1000);
}

document.addEventListener('click', resetSessionTimeout);
document.addEventListener('keypress', resetSessionTimeout);

// ======================
// MUSIC PLAYER FUNCTIONS
// ======================

function loadMusicList() {
    db.ref('music').on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            musicList = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
            displayPlaylist();
        } else {
            document.getElementById('playlistContainer').innerHTML = '<p class="no-music">No music uploaded yet</p>';
        }
    }, (error) => {
        console.error('Error loading music:', error);
    });
}

function displayPlaylist() {
    const container = document.getElementById('playlistContainer');
    container.innerHTML = '';
    
    if (musicList.length === 0) {
        container.innerHTML = '<p class="no-music">No music available</p>';
        return;
    }
    
    musicList.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = 'music-item';
        if (index === currentTrackIndex) item.classList.add('active');
        item.textContent = track.title || 'Unknown Track';
        item.onclick = () => selectTrack(index);
        container.appendChild(item);
    });
}

function selectTrack(index) {
    currentTrackIndex = index;
    const track = musicList[index];
    document.getElementById('currentTrack').textContent = track.title || 'Unknown';
    audio.src = track.url;
    displayPlaylist();
    playMusic();
}

function togglePlay() {
    if (currentTrackIndex === -1) {
        alert('Please select a music track first!');
        return;
    }
    
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        document.getElementById('playBtn').textContent = '▶️ Play';
    } else {
        audio.play();
        isPlaying = true;
        document.getElementById('playBtn').textContent = '⏸️ Pause';
    }
}

function playMusic() {
    if (currentTrackIndex === -1) return;
    audio.play().catch(error => {
        console.error('Playback error:', error);
    });
    isPlaying = true;
    document.getElementById('playBtn').textContent = '⏸️ Pause';
}

function stopMusic() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    document.getElementById('playBtn').textContent = '▶️ Play';
}

function nextTrack() {
    if (musicList.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % musicList.length;
    selectTrack(currentTrackIndex);
}

function changeVolume() {
    const slider = document.getElementById('volumeSlider');
    const volume = slider.value;
    audio.volume = volume / 100;
    document.getElementById('volumeValue').textContent = volume + '%';
}

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('currentTime').textContent = formatTime(audio.currentTime);
        document.getElementById('duration').textContent = formatTime(audio.duration);
    }
});

audio.addEventListener('ended', nextTrack);

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function loadInstructions() {
    db.ref('settings/instructions').on('value', (snapshot) => {
        const instructions = snapshot.val() || '<p>No instructions available</p>';
        document.getElementById('instructionsDisplay').innerHTML = instructions;
    });
}

// ======================
// ADMIN PANEL FUNCTIONS
// ======================

function adminClickCount() {
    clickCounter++;
    console.log(`Admin clicks: ${clickCounter}/${ADMIN_CLICKS}`);\n    \n    if (clickCounter >= ADMIN_CLICKS) {
        clickCounter = 0;
        document.getElementById('adminPanel').style.display = 'flex';
        document.getElementById('adminLoginBox').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

function verifyAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    
    db.ref('settings/adminPassword').once('value', (snapshot) => {
        const storedPassword = snapshot.val() || "Bhuvan@123";
        
        if (password === storedPassword) {
            adminMode = true;
            document.getElementById('adminLoginBox').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';
            loadAdminMusicList();
            loadAdminInstructions();
            document.getElementById('adminErrorMsg').textContent = '';
        } else {
            document.getElementById('adminErrorMsg').textContent = "❌ Incorrect Admin Password!";
            document.getElementById('adminPassword').value = '';
        }
    });
}

function closeAdminPanel() {
    adminMode = false;
    document.getElementById('adminPanel').style.display = 'none';
    clickCounter = 0;
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

// ======================
// MUSIC UPLOAD
// ======================

function uploadMusic() {
    const title = document.getElementById('musicTitle').value;
    const file = document.getElementById('musicFile').files[0];
    const statusDiv = document.getElementById('uploadStatus');
    
    if (!title || !file) {
        statusDiv.textContent = '❌ Please enter title and select file';
        statusDiv.className = 'status-msg error';
        return;
    }
    
    if (file.size > 200 * 1024 * 1024) {
        statusDiv.textContent = '❌ File size exceeds 200 MB limit';
        statusDiv.className = 'status-msg error';
        return;
    }
    
    statusDiv.textContent = '⏳ Uploading... Please wait';
    statusDiv.className = 'status-msg';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'magic-music');
    
    fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.secure_url) {
            const musicId = Date.now().toString();
            db.ref('music/' + musicId).set({
                title: title,
                url: data.secure_url,
                cloudinaryId: data.public_id,
                uploadedAt: new Date().toISOString()
            }).then(() => {
                statusDiv.textContent = '✅ Music uploaded successfully!';
                statusDiv.className = 'status-msg success';
                document.getElementById('musicTitle').value = '';
                document.getElementById('musicFile').value = '';
                loadAdminMusicList();
            }).catch(error => {
                statusDiv.textContent = '❌ Database error: ' + error.message;
                statusDiv.className = 'status-msg error';
            });
        } else {
            statusDiv.textContent = '❌ Upload failed: ' + (data.error?.message || 'Unknown error');
            statusDiv.className = 'status-msg error';
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        statusDiv.textContent = '❌ Upload failed: ' + error.message;
        statusDiv.className = 'status-msg error';
    });
}

// ======================
// MUSIC MANAGEMENT
// ======================

function loadAdminMusicList() {
    db.ref('music').on('value', (snapshot) => {
        const container = document.getElementById('musicList');
        container.innerHTML = '';
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                const track = data[key];
                const item = document.createElement('div');
                item.className = 'music-item-admin';
                item.innerHTML = `
                    <span>${track.title}</span>
                    <button class="delete-btn" onclick="deleteMusic('${key}', '${track.cloudinaryId}')">🗑️ Delete</button>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p class="loading-text">No music uploaded</p>';
        }
    });
}

function deleteMusic(firebaseId, cloudinaryId) {
    if (!confirm('Are you sure you want to delete this music?')) return;
    
    db.ref('music/' + firebaseId).remove().then(() => {
        loadAdminMusicList();
        loadMusicList();
    }).catch(error => {
        alert('Error deleting music: ' + error.message);
    });
}

// ======================
// INSTRUCTIONS MANAGEMENT
// ======================

function loadAdminInstructions() {
    db.ref('settings/instructions').once('value', (snapshot) => {
        const instructions = snapshot.val() || '';
        document.getElementById('instructionsText').value = instructions;
    });
}

function saveInstructions() {
    const instructions = document.getElementById('instructionsText').value;
    const statusDiv = document.getElementById('instructionsStatus');
    
    if (!instructions.trim()) {
        statusDiv.textContent = '❌ Please enter instructions';
        statusDiv.className = 'status-msg error';
        return;
    }
    
    db.ref('settings/instructions').set(instructions).then(() => {
        statusDiv.textContent = '✅ Instructions saved successfully!';
        statusDiv.className = 'status-msg success';
        loadInstructions();
    }).catch(error => {
        statusDiv.textContent = '❌ Error: ' + error.message;
        statusDiv.className = 'status-msg error';
    });
}

// ======================
// PASSWORD MANAGEMENT
// ======================

function changeOperatorPassword() {
    const newPassword = document.getElementById('newOperatorPassword').value;
    const statusDiv = document.getElementById('operatorPasswordStatus');
    
    if (!newPassword || newPassword.length < 6) {
        statusDiv.textContent = '❌ Password must be at least 6 characters';
        statusDiv.className = 'status-msg error';
        return;
    }
    
    db.ref('settings/operatorPassword').set(newPassword).then(() => {
        statusDiv.textContent = '✅ Operator password updated!';
        statusDiv.className = 'status-msg success';
        document.getElementById('newOperatorPassword').value = '';
    }).catch(error => {
        statusDiv.textContent = '❌ Error: ' + error.message;
        statusDiv.className = 'status-msg error';
    });
}

function changeAdminPassword() {
    const newPassword = document.getElementById('newAdminPassword').value;
    const statusDiv = document.getElementById('adminPasswordStatus');
    
    if (!newPassword || newPassword.length < 6) {
        statusDiv.textContent = '❌ Password must be at least 6 characters';
        statusDiv.className = 'status-msg error';
        return;
    }
    
    db.ref('settings/adminPassword').set(newPassword).then(() => {
        statusDiv.textContent = '✅ Admin password updated!';
        statusDiv.className = 'status-msg success';
        document.getElementById('newAdminPassword').value = '';
    }).catch(error => {
        statusDiv.textContent = '❌ Error: ' + error.message;
        statusDiv.className = 'status-msg error';
    });
}

// ======================
// LOGOUT
// ======================

function logout() {
    adminMode = false;
    sessionActive = false;
    isPlaying = false;
    clickCounter = 0;
    audio.pause();
    audio.currentTime = 0;
    
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('playerPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
}

// ======================
// SECURITY FEATURES
// ======================

window.addEventListener('beforeunload', (e) => {
    if (sessionActive) {
        e.preventDefault();
        e.returnValue = '';
    }
});

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'PrintScreen' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.key === 'F12') ||
        (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        return false;
    }
});

document.addEventListener('copy', (e) => {
    if (sessionActive) {
        e.preventDefault();
    }
});

document.addEventListener('paste', (e) => {
    if (sessionActive) {
        e.preventDefault();
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && sessionActive) {
        logout();
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🪄 Magic Music Player Initialized');
    document.getElementById('passwordInput').focus();
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPassword();
    });
    
    db.ref('settings').once('value', (snapshot) => {
        if (!snapshot.exists()) {
            db.ref('settings').set({
                operatorPassword: "Music@123",
                adminPassword: "Bhuvan@123",
                instructions: "<ul><li>जब मैं किसी दर्शक को मंच पर बुलाऊं तो संगीत धीमा या बंद करें</li><li>जब मैं अकेले मंच पर जादू करूं तो ध्वनि पूरी रखें</li></ul>"
            });
        }
    });
});
