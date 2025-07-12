"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../Store/auth.store.js";
import { axiosInstance } from "../Store/auth.store.js";
import { LogOut, UserPlus, LogIn, Menu, X, Atom, User, ChevronRight, Bell } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

function Navbar({ onMobileMenuToggle }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const { scrollY } = useScroll();

  const navVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20, transition: { duration: 0.2 } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const notificationVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  useEffect(() => {
    setIsLoaded(true);

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const sections = ["features", "testimonials", "contact"];
          const scrollPosition = window.scrollY + 100;

          for (const section of sections) {
            const element = document.getElementById(section);
            if (element) {
              const offsetTop = element.offsetTop;
              const offsetHeight = element.offsetHeight;
              if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                setActiveSection(section);
                break;
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Fetch notifications
    const fetchNotifications = async () => {
      if (user) {
        try {
          const response = await axiosInstance.get('/ask-question/notifications');
          setNotifications(response.data.notifications);
          setUnreadCount(response.data.unreadCount);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const handleNotificationClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      try {
        await axiosInstance.post('/ask-question/notifications/read');
        setUnreadCount(0);
      } catch (error) {
        console.error('Error marking notifications read:', error);
      }
    }
  };

  const navItems = [
    // { href: "#features", label: "Features" },
    // { href: "#testimonials", label: "Testimonials" },
    // { href: "#contact", label: "Contact" },
  ];

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    if (onMobileMenuToggle) onMobileMenuToggle(newState);
  };

  return (
    <>
      <motion.nav
        className={`fixed w-full z-50 transition-all duration-300 bg-transparent`}
        variants={navVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <motion.div className="flex items-center" variants={logoVariants} initial="hidden" animate="visible">
              <Link to="/" className="flex items-center gap-3 group">
                <motion.div
                  className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-secondary text-primary shadow-lg"
                  whileHover={isLoaded ? { rotate: 360, scale: 1.1, boxShadow: "0 0 20px rgba(0, 245, 212, 0.5)" } : {}}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <Atom size={22} />
                </motion.div>
                <span className="text-xl md:text-2xl font-bold font-heading bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent">
                  Drug Discovery AI
                </span>
              </Link>
            </motion.div>

            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className={`relative font-medium font-body transition-all duration-300 group ${
                    activeSection === item.href.slice(1)
                      ? "bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent"
                      : "text-text-primary hover:text-accent"
                  }`}
                  whileHover={isLoaded ? { y: -2 } : {}}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                  <motion.span
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-accent to-accent-secondary rounded-full"
                    initial={{ width: 0 }}
                    whileHover={isLoaded ? { width: "100%" } : {}}
                    transition={{ duration: 0.3 }}
                  />
                  {activeSection === item.href.slice(1) && isLoaded && (
                    <motion.span
                      className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-accent to-accent-secondary rounded-full"
                      layoutId="activeSection"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                    />
                  )}
                </motion.a>
              ))}
              <Link to="/ask-question">
                <motion.button
                  className="group relative px-6 py-2 overflow-hidden rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-primary transition-all duration-300 hover:shadow-lg hover:shadow-accent/25"
                  variants={buttonVariants}
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 245, 212, 0.4)", y: -2 }}
                  whileTap="tap"
                >
                  <span className="relative font-medium font-body flex items-center">
                    Ask a Question
                    <ChevronRight size={16} className="ml-2" />
                  </span>
                </motion.button>
              </Link>
              {user ? (
                <div className="flex items-center ml-6 space-x-4">
                  <div className="relative">
                    <motion.button
                      className="relative p-2 text-text-secondary hover:text-accent transition-colors duration-200"
                      whileHover={isLoaded ? { scale: 1.1 } : {}}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNotificationClick}
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full" />
                      )}
                    </motion.button>
                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          className="absolute right-0 mt-2 w-80 bg-primary/95 backdrop-blur-md rounded-lg shadow-xl border border-accent/20 p-4 z-50"
                          variants={notificationVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <h3 className="text-lg font-semibold text-text-primary mb-2">Notifications</h3>
                          {notifications.length === 0 ? (
                            <p className="text-text-secondary">No notifications</p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {notifications.map((notification) => (
                                <Link
                                  key={notification._id}
                                  to={`/answer-qs/${notification.relatedId}`}
                                  className={`block p-2 rounded-md ${
                                    notification.read ? 'bg-secondary/50' : 'bg-accent/20'
                                  } hover:bg-accent/30 transition-colors`}
                                  onClick={() => setShowNotifications(false)}
                                >
                                  <p className="text-sm text-text-primary">{notification.content}</p>
                                  <p className="text-xs text-text-secondary">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center space-x-3">
                    <motion.div
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-primary shadow-md"
                      whileHover={isLoaded ? { scale: 1.15, boxShadow: "0 0 15px rgba(0, 245, 212, 0.4)" } : {}}
                    >
                      <User size={16} />
                    </motion.div>
                    <div className="hidden lg:block">
                      <div className="text-xs text-text-secondary font-body">Welcome back,</div>
                      <div className="font-semibold text-text-primary font-body">{user.firstName || "User"}</div>
                    </div>
                  </div>
                  <motion.button
                    className="group relative px-4 py-2 overflow-hidden rounded-lg bg-secondary/80 text-text-primary transition-all duration-300 hover:shadow-md hover:bg-error/20 hover:text-error border border-transparent hover:border-error/30"
                    onClick={handleLogout}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <span className="relative font-medium font-body flex items-center">
                      Log Out
                      <LogOut size={16} className="ml-2" />
                    </span>
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center space-x-4 ml-6">
                  <Link to="/login">
                    <motion.button
                      className="group relative px-6 py-2 overflow-hidden rounded-lg border-2 border-secondary text-text-primary transition-all duration-300 hover:border-accent hover:text-accent"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <span className="relative font-medium font-body flex items-center">
                        Login
                        <LogIn size={16} className="ml-2" />
                      </span>
                    </motion.button>
                  </Link>
                  <Link to="/signup">
                    <motion.button
                      className="group relative px-6 py-2 overflow-hidden rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-primary transition-all duration-300 hover:shadow-lg hover:shadow-accent/25"
                      variants={buttonVariants}
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 245, 212, 0.4)", y: -2 }}
                      whileTap="tap"
                    >
                      <span className="relative font-medium font-body flex items-center">
                        Sign Up
                        <UserPlus size={16} className="ml-2" />
                      </span>
                    </motion.button>
                  </Link>
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <motion.button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-secondary/50 focus:outline-none transition-all duration-200"
                whileHover={isLoaded ? { scale: 1.1 } : {}}
                whileTap={{ scale: 0.95 }}
              >
                <span className="sr-only">Open main menu</span>
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X size={24} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu size={24} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden fixed inset-x-0 top-16 z-50 bg-transparent"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="px-4 pt-4 pb-6 space-y-3">
                {navItems.map((item) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md font-medium font-body transition-all duration-300 ${
                      activeSection === item.href.slice(1)
                        ? "bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent"
                        : "text-text-primary hover:text-accent"
                    }`}
                    whileHover={isLoaded ? { y: -2 } : {}}
                    transition={{ duration: 0.2 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}
                <Link to="/ask-question" onClick={() => setMobileMenuOpen(false)}>
                  <motion.button
                    className="w-full group relative px-6 py-2 overflow-hidden rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-primary transition-all duration-300 hover:shadow-lg hover:shadow-accent/25"
                    variants={buttonVariants}
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 245, 212, 0.4)", y: -2 }}
                    whileTap="tap"
                  >
                    <span className="relative font-medium font-body flex items-center">
                      Ask a Question
                      <ChevronRight size={16} className="ml-2" />
                    </span>
                  </motion.button>
                </Link>
                {user ? (
                  <div className="px-3 space-y-2">
                    <motion.button
                      className="w-full flex items-center gap-2 px-4 py-2 rounded-md text-text-primary hover:text-accent relative"
                      whileHover={isLoaded ? { scale: 1.05 } : {}}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNotificationClick}
                    >
                      <Bell size={16} />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-3 h-3 bg-error rounded-full" />
                      )}
                    </motion.button>
                    <motion.button
                      className="w-full flex items-center gap-2 px-4 py-2 rounded-md text-text-primary hover:text-accent"
                      whileHover={isLoaded ? { scale: 1.05 } : {}}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLogout}
                    >
                      <LogOut size={16} /> Log Out
                    </motion.button>
                  </div>
                ) : (
                  <div className="px-3 space-y-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <motion.button
                        className="w-full px-4 py-2 rounded-md border-2 border-secondary text-text-primary hover:border-accent hover:text-accent"
                        whileHover={isLoaded ? { scale: 1.05 } : {}}
                        whileTap={{ scale: 0.95 }}
                      >
                        Login
                      </motion.button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <motion.button
                        className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-accent to-accent-secondary text-primary"
                        whileHover={isLoaded ? { scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 245, 212, 0.4)", y: -2 } : {}}
                        whileTap="tap"
                      >
                        Sign Up
                      </motion.button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}

export default Navbar;