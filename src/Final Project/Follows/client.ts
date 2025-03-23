import axios from "axios";
import { response } from "express";
export const BASE_API = process.env.REACT_APP_BACKEND_URL;
console.log(`Base API URL: ${BASE_API}`);
export const FOLLOWS_API = `${BASE_API}/api/follows`;

export interface Follows {
  _id: string;
  user: string; 
  followers: string[]; 
  followings: string[];
}

const api = axios.create({
  withCredentials: true,
});

export const createFollow = async (follows: Follows) => {
  const response = await api.post(FOLLOWS_API, follows);
  return response.data;
};

export const deleteFollow = async (followId: string) => {
  const response = await api.delete(`${FOLLOWS_API}/${followId}`);
  return response.data;
};


export const findFollowsById = async (followId: string) => {
  const response = await api.get(`${FOLLOWS_API}/${followId}`);
  return response.data;
};

export const updateFollow = async (followId: string, follows: Follows) => {
  const response = await api.put(`${FOLLOWS_API}/${followId}`, follows);
  return response.data;
};
export const findFollowsByUserId = async (userId: string) => {
    try {
      const fullUrl = `${FOLLOWS_API}/user/${userId}`;
      console.log("Requesting follows from URL:", fullUrl);
      const response = await api.get(fullUrl);
      console.log("Response received:", response.data);
      return response.data;
    } catch (error) {
        console.error('Failed to load follows:', error);
        return [];
    }
};