import { useRef } from "react";
import {USER_END_POINT } from '../utils/constants';
import { useDispatch } from "react-redux";
import { setUser, setError} from '../redux/features/userSlice'
 
export default function Login() {
    const emailInputRef = useRef();
    const passwordInputRef = useRef();
    const dispatch = useDispatch();

    async function submitHandler (event) {
        event.preventDefault();

        const enteredEmail = emailInputRef.current.value.trim();
        const enteredPassword = passwordInputRef.current.value;

        const authData = {
            email : enteredEmail,
            password : enteredPassword
        }

        try {
            const res = await fetch(`${USER_END_POINT}/login`, {
                method : 'POST',
                body: JSON.stringify(authData),
                headers: {
                    'Content-Type' : 'application/json'
                },
                credentials: 'include'
            });

            const data = await res.json();

            if(res.ok && data.user) {
                localStorage.setItem('token', data.token)
                dispatch(
                    setUser({
                        user: data.user,
                        role : 'user',
                        userType : 'user',
                        token: data.token
                    })
                )
            } else {
                console.log("dhdyfydfhdyfhyfh");
                const errorMessage = data.error || 'Login failed';
                dispatch(setError(errorMessage))
            }
        } catch (error) {
            console.log('Login error : ', error);
            dispatch(setError("Something went wrong. Please try again."))
        }
    }

    return (
        <>
            <form onSubmit={submitHandler}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input id='email' type="email" ref={emailInputRef} required/>
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input id='password' type="password" ref={passwordInputRef} required/>
                </div>
                <div>
                    <button type="submit">Login</button>
                </div>
            </form>
        </>
    )
}