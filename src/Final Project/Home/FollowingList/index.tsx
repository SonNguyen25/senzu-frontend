import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import * as client from '../../Profile/client'; 
import * as followClient from '../../Follows/client';
import { get } from 'http';

function FollowingList() {
    const [followers, setFollowers] = useState<client.User[]>([]);
    const [sessionProfile, setSessionProfile] = useState<string>();

    async function fetchFollows() {
        if (!sessionProfile) return; // Exit if sessionProfile is not set yet

        try {
            const response = await followClient.findFollowsByUserId(sessionProfile);
            console.log("Follows response:", response);
            
            const followDoc = response[0];
            const followingIds = followDoc.followings;
            console.log("Following IDs:", followingIds);
            const allUsers = await client.findAllUsers();
            console.log("All users:", allUsers);
            const followingList = allUsers.filter((user: client.User) => followingIds.includes(user._id));
            console.log("Following list:", followingList);
            setFollowers(followingList);
        } catch (error) {
            console.error("Failed to fetch follows:", error);
            setFollowers([]);
        }
    }

    const getSessionProfile = async () => {
        try {
            const profile = await client.profile();
            if (profile && profile._id) {
                console.log("Profile fetched:", profile);
                setSessionProfile(profile._id);
            }
        } catch (error) {
            console.error("Failed to fetch session profile:", error);
        }
    };

    // Effect to fetch session profile
    useEffect(() => {
        getSessionProfile();
    }, []);

    // Effect to fetch follows, runs only after sessionProfile is set
    useEffect(() => {
        fetchFollows();
    }, [sessionProfile]);



    if (followers.length === 0) {
        return <div>You haven't follow anyone yet, let's get this space filled!</div>;
    }

    return (
        <div className="friends-list-container">
            {followers.map((followers, index) =>
                <Link to={`/Profile/${followers._id}`}>
                    <div key={index} className="friend">
                        <FaUser className="fs-2" />
                        <div className="friend-display-name">
                            {followers.displayName} 
                        </div>
                    </div>
                </Link>
            )}
        </div>
    );
}

export default FollowingList;


