import React from 'react'
import { BiLogOutCircle } from "react-icons/bi";

function Logout() {
  return (
    <div className='h-[10vh]'>
      <div>
      <BiLogOutCircle className='text-5xl text-white hover:bg-slate-700 duration-300 cursor-pointer rounded-full p-2 ml-2 mt-1' />
      </div>
    </div>
  )
}

export default Logout

