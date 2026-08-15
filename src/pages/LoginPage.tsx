import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Heart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AVATARS = ["🐱", "🐶", "🦊", "🐰", "🐻", "🦄", "🐼", "🐨"];

const LoginPage = () => {
  const { login, register, signInWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("🐱");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 5);
  })();

  const strengthColors = ["bg-destructive", "bg-destructive", "bg-accent", "bg-accent", "bg-green-400", "bg-green-400"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.includes("@")) e.email = "Enter a valid email";
    if (password.length < 6) e.password = "At least 6 characters";
    if (isRegister && !username.trim()) e.username = "Username required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setSuccessMessage("");
    if (!validate()) return;
    try {
      if (isRegister) {
        await register(username, email, password, avatar, gender);
        setSuccessMessage("Account created! Please check your email to verify your account.");
      } else {
        await login(email, password);
        navigate("/");
      }
    } catch (error) {
      console.error("Auth error:", error);
      const message = error instanceof Error ? error.message : "Authentication failed";
      setAuthError(message);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pookie-gradient opacity-20" />
      {[...Array(6)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl pointer-events-none opacity-20"
          animate={{ y: [0, -600], opacity: [0, 0.4, 0], rotate: [0, 360] }}
          transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, delay: i * 1.2 }}
          style={{ left: `${10 + i * 15}%`, bottom: "-5%" }}
        >
          💕
        </motion.span>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center gap-2 mb-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Heart className="text-primary fill-primary" size={32} />
            <h1 className="text-4xl font-brand pookie-text-gradient">PookieWatch</h1>
          </motion.div>
          <p className="text-muted-foreground text-sm">Watch together, love forever 💕</p>
        </div>

        <div className="glass-strong rounded-pookie p-8 pookie-glow">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {isRegister ? "Create your account ✨" : "Welcome back, pookie 💖"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your cute name"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm"
                  />
                  {errors.username && <p className="text-destructive text-xs mt-1">{errors.username}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Gender</label>
                  <div className="flex gap-2">
                    {(["male", "female"] as const).map((g) => (
                      <motion.button
                        key={g}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setGender(g)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          gender === g
                            ? "bg-primary/20 ring-2 ring-primary text-foreground"
                            : "bg-muted/30 hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {g === "male" ? "👦 Male" : "👧 Female"}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Pick your avatar</label>
                  <div className="flex gap-2 flex-wrap">
                    {AVATARS.map((a) => (
                      <motion.button
                        key={a}
                        type="button"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setAvatar(a)}
                        className={`text-2xl p-1.5 rounded-xl transition-all ${
                          avatar === a
                            ? "bg-primary/20 ring-2 ring-primary"
                            : "bg-muted/30 hover:bg-muted/50"
                        }`}
                      >
                        {a}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pookie@love.com"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm"
              />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}

              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= passwordStrength ? strengthColors[passwordStrength] : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{strengthLabels[passwordStrength]}</span>
                </div>
              )}
            </div>

            {!isRegister && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground">Remember me 💕</span>
              </label>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-xl pookie-gradient text-primary-foreground font-semibold text-sm pookie-glow disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isRegister ? "Creating magic..." : "Logging in..."}
                </>
              ) : (
                <>{isRegister ? "Join PookieWatch ✨" : "Login 💖"}</>
              )}
            </motion.button>

          </form>

          {authError && (
            <p className="text-destructive text-xs mt-3 text-center">{authError}</p>
          )}

          {successMessage && (
            <p className="text-green-400 text-xs mt-3 text-center">{successMessage}</p>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isRegister ? "Already have an account?" : "New here?"}{" "}
            <button
              onClick={() => { setIsRegister(!isRegister); setErrors({}); setAuthError(""); }}
              className="text-primary font-semibold hover:underline"
            >
              {isRegister ? "Login" : "Sign up"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
