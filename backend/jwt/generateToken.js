import jwt from "jsonwebtoken";

const createTokenAndSaveCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_TOKEN, {
    expiresIn: "10d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true only in prod
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // cross-site in prod, safe locally
    maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
  });
};

export default createTokenAndSaveCookie;
