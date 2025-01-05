import { ObjectId } from "mongoose";

export type Annotations = {
  [key: string]: {
    url: string;
    name: string;
  } | undefined;
}

export type PinData = {
  _id: ObjectId;
  pinUrl: string;
  pinMetaData: {
    title: string;
    description: string;
    annotations: {
      [key: string]: {
        url: string;
        name: string;
      } | undefined;
    };
    articleLink: string;
    pinner: {
      username: string;
      imageUrl: string;
      followersCount: number;
    };
  };
  createdAt: string;
  savesCount: number;
  commentCount: number;
  reactionCount: number;
  repinCount: number;
  pinImages: {
    "60x60": {
      width: number;
      height: number;
      url: string;
    };
    "136x136": {
      width: number;
      height: number;
      url: string;
    };
    "170x": {
      width: number;
      height: number;
      url: string;
    };
    "236x": {
      width: number;
      height: number;
      url: string;
    };
    "474x": {
      width: number;
      height: number;
      url: string;
    };
    "564x": {
      width: number;
      height: number;
      url: string;
    };
    "736x": {
      width: number;
      height: number;
      url: string;
    };
    "600x315": {
      width: number;
      height: number;
      url: string;
    };
    "1200x": {
      width: number;
      height: number;
      url: string;
    };
    orig: {
      width: number;
      height: number;
      url: string;
    };
  };
  dominentColor: string;
  board: {
    name: string;
    id: string;
    imageThumbnail: string;
    url: string;
    description: string;
    privacy: string;
    isCollaborative: boolean;
    layout: string;
    pinThumbnailUrls: string[];
    owner: {
      id: string;
      username: string;
      fullName: string;
      imageMediumUrl: string;
      isVerifiedMerchant: boolean;
    };
  };
};
