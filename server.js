const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// توجيه المتصفح لملفات الواجهة
app.use(express.static(path.join(__dirname, 'public')));

let players = {}; // تخزين اللاعبين بنظام الكائن لسهولة الوصول
let currentQuestion = null;

io.on('connection', (socket) => {
    
    // عند انضمام طالب
    socket.on('joinGame', (data) => {
        players[socket.id] = { 
            id: socket.id, 
            name: data.name, 
            score: 0 
        };
        // إرسال قائمة اللاعبين المحدثة للجميع (خاصة شاشة العرض)
        io.emit('updatePlayerList', Object.values(players));
    });

    // عند إرسال المعلم لسؤال جديد
    socket.on('sendQuestion', (questionData) => {
        currentQuestion = questionData;
        // تصفير حالة الإجابة في بداية كل سؤال (اختياري)
        io.emit('receiveQuestion', questionData);
    });

    // عند إجابة الطالب
    socket.on('submitAnswer', (data) => {
        if (currentQuestion && players[socket.id]) {
            // التحقق من صحة الإجابة
            if (data.answerIndex == currentQuestion.correct) {
                players[socket.id].score += 100; // إضافة 100 نقطة للإجابة الصحيحة
            }
            // إبلاغ المعلم بأن شخصاً ما أجاب
            io.emit('playerAnswered', { name: players[socket.id].name });
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayerList', Object.values(players));
    });
});

// ملاحظة هامة: الاستضافات السحابية تملي المنفذ عبر process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});