"use client";

import Link from "next/link";

const SigninButton = () => {
  return (
    <Link className="btn btn-primary" href="/signin">
      Login
    </Link>
  );
};

export default SigninButton;