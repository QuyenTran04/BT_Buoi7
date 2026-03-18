var express = require("express");
var router = express.Router();
let userController = require('../controllers/users')
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
let fs = require('fs');
const { CheckLogin } = require("../utils/authHandler");
const { ChangePasswordValidator, validatedResult } = require("../utils/validateHandler");

router.post('/register', async function (req, res, next) {
    try {
        let { username, password, email } = req.body;
        let newUser = await userController.CreateAnUser(
            username, password, email, "69b0ddec842e41e8160132b8"
        )
        res.send(newUser)
    } catch (error) {
        res.status(404).send(error.message)
    }

})
router.post('/login', async function (req, res, next) {
    try {
        let { username, password } = req.body;
        let user = await userController.GetAnUserByUsername(username);
        if (!user) {
            res.status(404).send({
                message: "thong tin dang nhap sai"
            })
            return;
        }
        if (user.lockTime > Date.now()) {
            res.status(404).send({
                message: "ban dang bi ban"
            })
            return
        }
        if (bcrypt.compareSync(password, user.password)) {
            loginCount = 0;
            await user.save()
            let token = jwt.sign({
                id: user._id
            }, 'secret', {
                expiresIn: '1h'
            })
            res.send(token)
        } else {
            user.loginCount++;
            if (user.loginCount == 3) {
                user.loginCount = 0;
                user.lockTime = Date.now() + 3600 * 1000
            }
            await user.save()
            res.status(404).send({
                message: "thong tin dang nhap sai"
            })
        }
    } catch (error) {
        res.status(404).send({
            message: error.message
        })
    }

})
router.get('/me', CheckLogin, function (req, res, next) {
    res.send(req.user)
})

router.put('/change-password', CheckLogin, ChangePasswordValidator, validatedResult, async function (req, res, next) {
    try {
        let { oldPassword, newPassword } = req.body;

        if (oldPassword === newPassword) {
            return res.status(400).send({
                message: "Mật khẩu mới không được trùng với mật khẩu cũ"
            });
        }

        // --- Kiểm tra oldPassword ---
        let isMatch = bcrypt.compareSync(oldPassword, req.user.password);
        if (!isMatch) {
            return res.status(400).send({
                message: "Mật khẩu cũ không đúng"
            });
        }

        // --- Cập nhật password mới (pre('save') sẽ tự hash) ---
        req.user.password = newPassword;
        await req.user.save();

        res.send({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})

module.exports = router;