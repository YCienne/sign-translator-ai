import React from 'react'
import logo from "../assets/logo.svg"
import star from "../assets/star.svg"
import { useState } from "react";
import {navigation} from "../constants"
import MenuSvg from '../assets/MenuSvg';
import Button from './designs/button';
import { HamburgerMenu } from './designs/header';


const Header = () => {
    const [openNavigation, setopenNavigation] = useState(false);
    const toggleNavigation = () => {
        if (openNavigation) {
            setopenNavigation(false);
        } else {
            setopenNavigation(true)
        }
    };

    const handleClick = () => {
        setopenNavigation(false)
    }
  return (
    <div className={`fixed top-0 left-0 w-full z-50 mb-200  border-b bg-gray-950 lg:bg-gray-950 lg:backdrop-blur-sm ${
        openNavigation ? "bg-gray-950" : "bg-gray-950 backdrop-blur-sm"
        }`}>
      <div className="flex  items-center px-5 lg:px-6 xl:px-10 max-lg:py-4">
        <a className="flex w-[8rem] xl:mr-8" href="#sikiza">
        <img src={star} width={50} height={10} alt="star" />
        <img src={logo} width={80} height={10} alt="sikiza" />

        </a>
        <nav className={` ${openNavigation ? 'flex' : 'hidden'} fixed top-[5rem] left-0 right-0 bottom-0 bg-gray-900 lg:static lg:flex lg:mx-auto lg:bg-transparent`}>
                <div className="relative z-2 flex flex-col items-center justify-end m-auto  lg:flex-row lg:justify-end ">
                    {navigation.map((item) => (
                        <a key={item.id} href={item.url} onClick={handleClick} className={`block relative font-code text-2xl uppercase text-n-1 transition-colors right-0 left-3/4 ${item.onlyMobile ? "lg:hidden" : ""} md:py-8 lg:-mr-0.25 lg:text-xs lg:font-semibold`}>
                            {item.title}
                        </a>
                    ))}
                    <HamburgerMenu />

                </div>
            </nav>
            <Button className="ml-auto lg:hidden" px="px-3" onClick={toggleNavigation}>
                <MenuSvg openNavigation={openNavigation}/>
            </Button>
      </div>
    </div>
  )
}

export default Header
