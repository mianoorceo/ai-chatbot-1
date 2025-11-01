import { motion } from "framer-motion";

export const Greeting = () => {
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-xl md:text-2xl text-right"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        سلام به چت بات ما خوش اومدی
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-zinc-500 md:text-2xl text-right py-2"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        چجوری می تونم کمکت کنم؟
      </motion.div>
    </div>
  );
};
