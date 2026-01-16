import { motion } from "framer-motion";

export default function MenuManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Menu Management</h1>
        <p className="text-steelBlue">Add, edit, and manage menu items</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 text-center"
      >
        <p className="text-steelBlue">Menu management interface coming soon.</p>
        <p className="text-text-muted text-sm mt-2">
          For now, menu items can be managed directly in MongoDB.
        </p>
      </motion.div>
    </div>
  );
}
