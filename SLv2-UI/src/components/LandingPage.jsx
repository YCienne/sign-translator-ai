import React from 'react';
import { bg, LT} from '../assets';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const LandingPage = () => {
    return (
        <div className="fixed w-full h-screen flex flex-col lg:flex-row items-center justify-between text-white">
            <Header />

            
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                style={{ backgroundImage: `url(${bg})` }}
            />

            
            <div className="relative z-10 flex flex-col lg:flex-row gap-10 w-full h-full px-6 md:px-12 lg:px-16 sm:gap-5 sm:top-20">
                
                
                <div className="flex justify-center w-full lg:w-1/3 items-center lg:items-start py-36 lg:py-30 ">
                    <img src={LT} alt="Logo" className="w-2/3 lg:w-full h-auto  md:mb-40" />
                </div>

                
                <div className="flex items-center justify-center lg:justify-end w-full lg:w-1/2 mt-0 lg:mt-0">
                    <Link to="/translator" className="relative flex items-center justify-center w-2/3 sm:w-1/2 lg:w-1/3">
                    <button className="absolute flex-items top-0 left-4 text-lg font-bold py-2 px-12 w-56 bg-gray-950 text-white rounded-full">
                    Let's Chat
                </button>
                    
                    </Link>
                </div>

            </div>

            <Footer />
        </div>
    );
};

export default LandingPage;
