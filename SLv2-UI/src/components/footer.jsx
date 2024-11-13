import { socials } from "../constants";
import Section from "./section";

const Footer = () => {
  return (
    <footer className="bg-n-8 text-white w-full pl-4 pr-8 mt-auto fixed bottom-0 right-0 left-0 z-50  border-b border-n-6 lg:bg-n-8/90 lg:backdrop-blur-sm ">
      <Section id="Footer" > 
        <div className="w-full flex justify-between items-center gap-5 max-sm:flex-col px-2"> {/* Add padding on sides */}
          <p className="caption text-n-4 lg:block">© {new Date().getFullYear()}. All rights reserved</p>

          <ul className="flex gap-5">
            {socials.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-5 bg-n-7 rounded-sm transition-colors hover:bg-n-2" // Reduce icon size
              >
                <img src={item.iconUrl} width={25} height={25} alt={item.title} />
              </a>
            ))}
          </ul>
        </div>
      </Section>
    </footer>
  );
};

export default Footer;
