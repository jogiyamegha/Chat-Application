import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {Navigate, useLocation} from 'react-router-dom'
import { clearUser, setUser } from '../store/userSlice';

const USER_CONFIG = {
    user : {
        endPoint : `${USER_CONFIG}/user`,
        loginRoutes : '/user/login',
        role : 'user'
    }
}

export default function ProtectedRoutes({
    children,
    userType = null,
    allowedRoles = [],
}) {
    const dispatch = useDispatch();
    const {user, role, loading} = useSelector((state) => state.user);
    const [authChecked, setAuthChecked] = useState(false);
    const location = useLocation()

    const detectedUserType = userType || (location.pathname.startsWith('/user')) ? 'user' : '';

    const config = USER_CONFIG[detectedUserType];
    const getUser = useCallback(async () => {
        try {
            const response = await fetch(config.endPoint, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type" : 'application/json'
                }
            });

            const data = await response.json();

            if(response.ok && data.user){
                dispatch( 
                    setUser({
                        user: data.user,
                        userType : detectedUserType,
                        role: config.role
                    })
                );
            } else {
                dispatch(clearUser());
            }
        } catch (error) {
            console.log(`Autj error for ${detectedUserType}`, error);
            dispatch(clearUser());
        } finally {
            setAuthChecked(true)
        }
    }, [config.endPoint, config.role, detectedUserType, dispatch])

    useEffect(() => {
        if(!authChecked) {
            getUser()
        }
    }, [authChecked, getUser]);

    if(loading || !authChecked) {
        return(
            <div>
                <p>loading</p>
            </div>
        )
    }

    if(!user) {
        return <Navigate to={config.loginRoutes} replace />
    }

    if(allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
        return <Navigate to={config.loginRoutes} replace />
    }

    return children;
}