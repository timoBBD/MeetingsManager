import {paths} from "../enums/paths.tsx";
import {Button, FormGroup, Modal, Stack, TextField} from "@mui/material";
import {useFormik} from "formik";
import * as yup from "yup";
import React, {useState} from "react";
import {AddBox, CircleNotifications} from "@mui/icons-material";
import './Navbar.css';
import ToastComponent from "./ToastComponent.tsx";

type FormDataType = { email: string; }

const validationSchema = yup.object({
    email: yup.string().max(255).required('This field is required')
});

const NavbarSocial = () => {
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');

    const token = localStorage.getItem("id_token");

    const [getFriendRequestCount, setGetFriendRequestCount] = useState<number>(0);
    const [modalOpen, setModalOpen] = useState<boolean>(false);

    const formik = useFormik<FormDataType>({
        initialValues: {
            email: '',
        },
        validationSchema: validationSchema,
        onSubmit: (values: FormDataType) => {
            const url = `${paths.apiUrlLocal}/friends/makeRequest`

            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    targetEmail: values.email,
                }).toString()
            };

            fetch(url, options)
                .then(result => {
                    result.json()
                        .then(asJson => {
                            if (!result.ok) {
                                setShowToast(true);
                                setToastMessage('There was an error trying to make your friend request. Please try again later.');

                                handleClose();
                            }
                            else {
                                setShowToast(true);
                                setToastMessage(`${asJson.hasOwnProperty('alert')
                                    ? asJson.alert
                                    : 'Successfully sent your friend request.'}`);
                                handleClose();
                            }
                        });
                });
        },
    },);

    const handleClose = () => {
        formik.resetForm();
        setModalOpen(false);
    }

    const handleFriendRequest = (isRejected: boolean, senderEmail: string) => {
        const condition = isRejected ? 'rejected ' : 'accepted;'
        const url = `${paths.apiUrlLocal}/friends/handleRequest`
        const options = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('id_token')}`,
            },
            body: JSON.stringify({
                senderEmail: senderEmail,
                status: `${isRejected ? 'rejected' : 'accepted'}`,
            }).toString()
        };

        fetch(url.toString(), options)
            .then(result => result.json()
                .then(asJson => {
                    if (!result.ok) {
                        setShowToast(true);
                        setToastMessage('There was an error handling that friend request, please try again later.');
                    }
                    else {
                        setShowToast(true);
                        setToastMessage(`${asJson.hasOwnProperty('alert')
                            ? asJson.alert
                            : `Successfully ${condition} that friend request.`}`);

                        setGetFriendRequestCount(prevState => prevState + 1);
                    }
                }));
    }

    const [friendInvites, setFriendInvites] = useState<JSX.Element[]>([]);

    React.useEffect(
        () => {
            const options = {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            };

            const url = `${paths.apiUrlLocal}/complex/getFriendRequests`;
            fetch(url, options)
                .then(result => result.json()
                    .then(friends => {
                        const tmpFriends = [];

                        if (!result.ok) {
                            setShowToast(true);
                            setToastMessage('There was an error getting your friend requests. Please try again later.');
                        }
                        else {
                            if (Array.isArray(friends)) {
                                for (const friend of friends){
                                    tmpFriends.push(
                                        <div
                                            key={`friend-${friend.email}`}
                                            style={{border: '1px solid black'}}
                                        >
                                            <p>{`From: ${friend.email}`}</p>
                                            <button onClick={() => handleFriendRequest(true, friend.email)} type="button">Reject</button>
                                            <button onClick={() => handleFriendRequest(false, friend.email)} type="button">Accept</button>
                                        </div>
                                    );
                                }
                            }
                        }

                        setFriendInvites(tmpFriends);
                    }));
        }, [getFriendRequestCount]
    );

    return (
        <div>
            <div className="dropdown">
                <Button
                    color="inherit"
                    onClick={() => setModalOpen(true)}
                    endIcon={<CircleNotifications/>}
                >
                Social
                </Button>

                <div className="dropdown-content">
                    {friendInvites}
                </div>
            </div>

             <Modal open={modalOpen} onClose={() => setModalOpen(false)} disableAutoFocus className="absolute flex items-center justify-center">
                 <FormGroup className="md:w-7/12 w-11/12 h-fit items-center bg-anti-flash-white p-8 rounded-3xl">
                     <h3 className="text-3xl">Send Friend Request</h3>
                     <form onSubmit={formik.handleSubmit} className="md:w-8/12 w-full justify-center">
                         <Stack direction={'column'} className="flex flex-col gap-4 p-8">
                             <TextField label='Email' name="email" value={formik.values.email}
                                        onChange={formik.handleChange} onBlur={formik.handleBlur}
                                        error={formik.touched.email && Boolean(formik.errors.email)}
                                        helperText={formik.touched.email && formik.errors.email}
                                        autoComplete={'off'} required/>
                         </Stack>

                         <Stack direction={'row'} className="w-full flex justify-between gap-2 px-8 pb-8">
                             <Button variant={'outlined'} onClick={handleClose} className='w-full'>Cancel</Button>
                             <Button variant={'contained'} type="submit" endIcon={<AddBox />} className='w-full'>Submit</Button>
                         </Stack>
                     </form>
                 </FormGroup>
             </Modal>

            <ToastComponent
                duration={1500}
                message={toastMessage}
                open={showToast}
                onClose={() => {
                    setShowToast(false);
                }}
            />
         </div>
    );
}

export default NavbarSocial
