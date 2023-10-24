const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8000;
const hbs = require("hbs");
require('dotenv').config()
const SignUpcollection = require("./public/javascript/mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcryptjs = require("bcryptjs");
const session = require("express-session");
const flash = require("express-flash");
const bodyParser = require("body-parser");

const server = http.createServer((request, response) =>{
    if(request.method !== 'GET'){
        response.statusCode = 405;
        response.end('<h1>405 Method Not Allowed!</h1>');
        return;
    }
    let {pathname} = new URL(request.url,'http://127.0.0.1');
    let root = __dirname;
    let filepath = root + pathname ;
    let mimes = {
        html:'text/html',
        hbs:'text/hbs',
        css:'text/css',
        js:'text/javascript',
        png:'image/png',
        jpg:'image/jpg',
        gif:'image/gif',
        mp4:'video/mp4',
        mp3:'audio/mp3',
        json:'aplication/json'
    }

    fs.readFile(filepath, (err, data) =>{
        response.setHeader('Accept-Ranges', 'bytes');
        if(err){
            console.log(err);
            response.setHeader('content-type','text/html;charset=utf-8');
            switch(err.code){
                case 'ENOENT':
                    response.statusCode = 404;
                    response.end('<h1>Page cannot be found!😭</h1>');
                case 'EPERM':
                    response.statusCode = 403;
                    response.end('<h1>尚未授權</h1>');
                default:
                    response.statusCode = 500;
                    response.end('<h1>Internet server Error!!</h1>')
            }
            return;
        }
        let ext = path.extname(filepath).slice(1);
        let type = mimes[ext];
        if(type){
            if(ext === 'html'){
                response.setHeader('content-type',type + ';charset=utf-8' );
            }else{
                response.setHeader('content-type',type);
            }
        }else{
            response.setHeader('content-type','application/octet-stream');
        }
        response.end(data);
    })
});

const DirPath = path.join(__dirname)
const publicPath = path.join(__dirname,'./public')

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:false}))
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(session({
    secret:"secret key",
    resave:false,
    saveUninitialized:true,
    cookie:{
        maxAge:600000
    }
}))
app.use(flash())
app.use((req, res, next)=>{
    app.locals.error = req.flash('error')
    app.locals.error2 = req.flash('error2')
    app.locals.error3 = req.flash('error3')
    app.locals.error4 = req.flash('error4')

    next();
  });
  


app.set("view engine","hbs")
app.set("views", DirPath)

app.use(express.static(publicPath)); 


async function hashPass(psd){
    const res = await bcryptjs.hash(psd,10)
    return res
}

async function compare(userPass,hashPass){
    const res = await bcryptjs.compare(userPass,hashPass)
    return res
    
}

app.get("/",(req,res) =>{
    if(req.cookies.jwt){
        const verify = jwt.verify(req.cookies.jwt,"WelcometoEmic")
        res.render("HomePage",{ID:verify.ID})
    }
    else{
    console.log(req.flash());
    res.render("sign-in",{messages: req.flash()});
    }
})


app.get("/sign-in",(req,res) =>{
    
    if(req.cookies.jwt){
        const verify = jwt.verify(req.cookies.jwt,"WelcometoEmic")
        res.render("HomePage",{ID:verify.ID})
    }
    else{
    console.log(req.flash());
    res.render("sign-in",{messages: req.flash()});
    }
})


app.get("/sign-up",(req,res) =>{
    
    if(req.cookies.jwt){
        const verify = jwt.verify(req.cookies.jwt,"WelcometoEmic")
    res.render("HomePage",{ID:verify.ID})
    }
    else{
    console.log(req.flash());
    res.render("sign-up",{messages: req.flash()});
    }
})

app.get("/ForgetPage",(req,res) =>{
    res.render("ForgetPage");
})

app.get("/Next", (req,res) =>{
    res.render("ForgetPageReset");

})
app.get("/reset", (req,res) =>{
    res.render("ForgetPageReset");

})


app.post("/login",async (req,res) =>{
    let {ID, psd} = req.body;
    ID = ID.trim();
    psd = psd.trim();

if(ID == "" || psd == ""){
        req.flash("error","Empty input fields!");
        return res.redirect('/sign-in');

}else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(ID)){
        req.flash("error","Invaild email entered!");
        return res.redirect('/sign-in');    
}else{
    
    try {
        const check = await SignUpcollection.findOne({ID:req.body.ID})
        const passCheck = await compare(req.body.psd,check.psd)


        if(check && passCheck){

            res.cookie("jwt",check.token,{
                maxAge:600000,
                httpOnly:true
            })

            res.render("HomePage",{ID:req.body.ID})
        }
        else{
            req.flash("error","Password Incorrect!");
            return res.redirect('/sign-in');
    
        }

    } catch {
        req.flash("error","No Exist!");
        return res.redirect('/sign-in');
    }
}
});

app.post("/signup",async (req,res) =>{
    let {Name, ID, psd} = req.body;
    Name = Name.trim();
    ID = ID.trim();
    psd = psd.trim();

if(Name == "" || ID == "" || psd == ""){
    req.flash("error2","Empty input fields!");
    return res.redirect('/sign-up');
}else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(ID)){
    req.flash("error2","Invaild email entered!");
    return res.redirect('/sign-up');
}else if(psd.length < 6){
    req.flash("error2","Password must be at least 6 characters.");
    return res.redirect('/sign-up');
}
else{

    try {
        const check =await SignUpcollection.findOne({ID:req.body.ID})

        if(check){
            req.flash("error2","user already exist!");
            return res.redirect('/sign-up');
        }
        else{
            const token = jwt.sign({ID:req.body.ID},"WelcometoEmic")
        
            
            res.cookie("jwt",token,{
                maxAge:600000,
                httpOnly:true
            })


            const data ={
                Name:req.body.Name,
                ID:req.body.ID,
                psd:await hashPass(req.body.psd),
                token:token
            }
            await SignUpcollection.insertMany([data])
        
            res.render("HomePage",{ID:req.body.ID})

        }

    } catch (error) {
        res.send("wrong details")
    }
}
})
app.post("/logout",(req,res) =>{
    res.clearCookie("jwt");
    res.render("sign-in");
})
app.post("/Home",(req,res) =>{
    res.render("sign-in");
})

app.post("/Next",async (req,res) =>{
    let {ID} = req.body;
    ID = ID.trim();

if(ID == "" ){
        req.flash("error3","Empty input fields!");
        return res.redirect('/ForgetPage');

}else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(ID)){
        req.flash("error3","Invaild email entered!");
        return res.redirect('/ForgetPage');    
}else{
    
    try {
        const check = await SignUpcollection.findOne({ID:req.body.ID})

        if(check){
            res.render("ForgetPageReset")
        }
        else{
            req.flash("error3","No Exist!");
            return res.redirect('/ForgetPage');
        }

    } catch {
        req.flash("error3","Internal problem!");
        return res.redirect('/ForgetPage');
    }
}
});

app.post("/reset",async (req,res) =>{
    let {psd} = req.body;
    psd = psd.trim();

if(psd == "" ){
        req.flash("error4","Empty input fields!");
        return res.redirect('/reset');
  
}else if(psd.length < 6){
    req.flash("error4","Password must be at least 6 characters.");
    return res.redirect('/reset');

}else{
    
    try {
        res.render("ResetSuccessful");
        
    } catch {
        req.flash("error4","Internal problem!");
        return res.redirect('/reset');
    }
}
});



app.listen(PORT, () =>{
    console.log(`${PORT}`);
});