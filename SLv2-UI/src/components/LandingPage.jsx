import React from 'react';
import { bg, LT, button } from '../assets';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './footer';

const LandingPage = () => {
    return (
        <div className="relative w-full h-screen flex flex-col lg:flex-row items-center justify-between text-white">
            <Header />

            
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                style={{ backgroundImage: `url(${bg})` }}
            />

            
            <div className="relative z-10 flex flex-col lg:flex-row gap-10 w-full h-full px-6 md:px-12 lg:px-16 sm:mt-20">
                
                
                <div className="flex flex-col justify-center w-full lg:w-1/3 items-center lg:items-start py-10 lg:py-0 sm:mt-20">
                    <img src={LT} alt="Logo" className="w-2/3 sm:w-1/2 lg:w-full h-auto mb-4" />
                </div>

                
                <div className="flex items-center justify-center lg:justify-end w-full lg:w-1/2 mt-6 lg:mt-0">
                    <Link to="/translator" className="relative flex items-center justify-center w-2/3 sm:w-1/2 lg:w-1/3">
                        <img src={button} className="w-full h-auto" alt="Chat Button" />
                        <h1 className="absolute inset-0 flex items-center justify-center text-white text-lg md:text-xl font-extrabold">
                            Let's chat
                        </h1>
                    </Link>
                </div>

            </div>

            <Footer />
        </div>
    );
};

export default LandingPage;
