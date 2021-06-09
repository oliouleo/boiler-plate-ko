const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

// 모델은 무엇인가
// 스키마를 감싸 주는 역할을 한다.

// 스키마란?
// 어떤 상품에 관련된 글을 작성한다고 치자.
// 글을 작성한 사람이 누구인지를 써야 한다.
// 작성하 때 포스트의 이름이 무엇인지, 상품에 관한 평, 타입은 무엇인지,
// 하나하나 지정해 주는 것이 스키마를 통해 가능하다.
// 스키마는 하나하나의 정보들을 지정해 줄 수 있는 것.


const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true, // 띄워쓰기 제거
        unique: 1 // 중복 방지
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
})

//유저 정보를 저장하기전에 무엇을 한다.
userSchema.pre('save', function( next ){
    var user = this;

    //password가 변경 될때만...
    if(user.isModified('password')){
        
        //비밀번호를 암호화 시킨다.
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if(err) return next(err)
    
            bcrypt.hash(user.password, salt, (err, hash) => {
                if(err) return next(err)
                user.password = hash;
                next(); //저장하는 곳으로 이동시킴
            })
        })
    } else {
        next()
    }
})

userSchema.methods.comparePassword = function(plainPassword, cb) {
    // 비밀번호를 비교할 때 플레인 패스워드가 있다면 데이터 베이스에 있는 암호화된 비밀번호가 같은지 체크를 해야 하는데,
    // 들어오는 비밀번호도 암호화를 해야 한다;; 
    //plainPassword 1234567     암호화된 비밀번호 $2b$10$HZ4tj
    bcrypt.compare(plainPassword, this.password, function(err, isMatch) {
        if(err) return cb(err)
        cb(null, isMatch)
    })
}

userSchema.methods.generateToken = function(cb) {
    // 웹토큰을 이용해서 토큰을 생성해야 한다.
    let user = this;
    let token = jwt.sign(user._id.toHexString(), 'secretToken')

   // user._id + 'secretToken' = token

   user.token = token
   user.save(function(err, user) {
       if(err) return cb(err)
       cb(null, user)
   })
}

userSchema.statics.findByToken = function(token, cb) {
    let user = this;
   // 토큰을 decode
    jwt.verify(token, 'secretToken', function (err, decoded) {
        // 유저 아이디를 이용해서 유저를 찾은 다음,
        // 클라이언트에서 가져온 토큰과 데이터 베이스에 보관된
        // 토큰이 일치하는지 확인한다
           user.findOne({"_id": decoded, "token": token}, function(err, user) {
              
               if(err) return cb(err);
               cb(null, user)

           })
    })
}
const User = mongoose.model('User', userSchema)

module.exports = { User }