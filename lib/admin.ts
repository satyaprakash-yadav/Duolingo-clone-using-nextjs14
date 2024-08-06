import { auth } from "@clerk/nextjs/server";

const allowedIds = [
    "user_2iXL7CdbclCfxsfN1n42oR5ERNW",
    "user_2iXLRWBZeQZi7hBMHKbFEllMEpa",
];

export const getIsAdmin = async () => {
    const {userId} = await auth();

    if (!userId) {
        return false
    };

    return allowedIds.indexOf(userId) !== -1;
};
