import {LightningElement } from 'lwc';
const BACKEND_URL = 'https://lead-management-be-db0bd8b494eb.herokuapp.com' ||'https://lead-management-be.onrender.com'||'http://localhost:3002'
export default class Login extends LightningElement{
    get loginUrl(){
        return `${BACKEND_URL}/oauth2/login`
    }
}