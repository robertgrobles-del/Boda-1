
import React from 'react';
import { Upload, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

export const InstagramSection: React.FC = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center bg-[#fdfaf6] py-20 px-6 lg:px-32 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left Column: Text and Buttons */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-10"
        >
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl lg:text-8xl leading-tight">
              <span className="font-signature text-[#4a5d23] block">Capture the</span>
              <span className="font-serif italic text-[#4a5d23]">Momento</span>
            </h2>
            <p className="text-stone-500 text-lg md:text-xl font-serif italic max-w-lg leading-relaxed">
              Join our digital gallery! Use our wedding hashtag on Instagram or upload your favorite snaps directly to our live wall.
            </p>
          </div>

          <div className="space-y-6">
            {/* Hashtag Pill */}
            <div className="inline-block px-8 py-4 bg-[#f4ece1] rounded-full">
              <span className="text-xl md:text-2xl font-serif font-bold text-[#b35a44]">
                #StephanieAndDanielGlow
              </span>
            </div>

            {/* Action Button */}
            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-4 px-10 py-5 bg-[#4a5d23] text-white text-xs md:text-sm uppercase font-black tracking-[0.3em] rounded-full shadow-xl hover:bg-[#3d4d1d] transition-all duration-300"
              >
                <Upload size={18} />
                UPLOAD PHOTOS
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Image Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative grid grid-cols-2 gap-4 h-[500px] md:h-[600px] items-center"
        >
          {/* Top Left Image */}
          <div className="space-y-4 flex flex-col justify-end h-full">
            <div className="h-48 md:h-56 rounded-[2.5rem] overflow-hidden shadow-lg transform -rotate-2">
              <img
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600"
                alt="Groom and Bride"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Bottom Left Image (Tall) */}
            <div className="flex-grow h-64 md:h-80 rounded-[2.5rem] overflow-hidden shadow-lg border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&q=80&w=600"
                alt="Wedding Dinner"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Images */}
          <div className="space-y-4 h-full flex flex-col py-8">
            <div className="flex-grow rounded-[2.5rem] overflow-hidden shadow-lg transform rotate-2">
              <img
                src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=600"
                alt="Close up"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Magic Box (Yellow Accent) */}
            <div className="h-40 md:h-48 bg-[#fdf148] rounded-[2.5rem] flex items-center justify-center p-8 text-center shadow-lg">
              <p className="font-signature text-[#4a5d23] text-2xl md:text-3xl rotate-[-5deg]">
                Add your magic here!
              </p>
            </div>
          </div>

          {/* Floating Instagram Icon Accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl z-20">
            <Instagram className="text-[#4a5d23]" size={28} />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
