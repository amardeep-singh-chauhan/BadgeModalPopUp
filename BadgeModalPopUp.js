// BadgePopModal.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Box, Paper, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { motion, AnimatePresence } from "framer-motion";

export default function BadgePopModal({ outsideClose = false, modalWidth = "50%", modalHeight = "50vh", }) {
  const badgeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 }); // initial translate (from badge -> center)
  const [visibleKey, setVisibleKey] = useState(0); // force remeasure if needed

  // measure badge center and compute initial translate so modal appears to originate from badge
  const measureOrigin = useCallback(() => {
    const badge = badgeRef.current;
    if (!badge) return { x: 0, y: 0 };
    const br = badge.getBoundingClientRect();

    // viewport center for modal destination
    const vw = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0
    );
    const vh = Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0
    );
    const modalCenterX = vw / 2;
    const modalCenterY = vh / 2;

    const badgeCenterX = br.left + br.width / 2;
    const badgeCenterY = br.top + br.height / 2;

    // initial translate values (badge -> modal center)
    const initialX = badgeCenterX - modalCenterX;
    const initialY = badgeCenterY - modalCenterY;

    return { x: initialX, y: initialY };
  }, []);

  useEffect(() => {
    if (open) {
      setOrigin(measureOrigin());
      // remeasure if layout changes while open (optional)
      const onResize = () => setOrigin(measureOrigin());
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onResize, { passive: true });
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onResize);
      };
    }
  }, [open, measureOrigin]);

  // prevent body scroll while modal open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // handle ESC key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Motion variants use the measured origin so entry/exit animate correctly
  const modalVariants = {
    initial: (o) => ({
      x: o.x,
      y: o.y,
      scale: 0.18,
      opacity: 0,
      borderRadius: 12,
      boxShadow: "0px 10px 30px rgba(0,0,0,0.2)",
    }),
    animate: {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      borderRadius: 12,
      transition: { type: "spring", stiffness: 320, damping: 28 },
    },
    exit: (o) => ({
      x: o.x,
      y: o.y,
      scale: 0.18,
      opacity: 0,
      transition: { type: "spring", stiffness: 400, damping: 32 },
    }),
  };

  return (
    <>
      {/* Example UI with a number badge */}
      <Box sx={{ p: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h6">Messages</Typography>

        <Box
          ref={badgeRef}
          onClick={() => {
            // measure right before opening to be fresh
            setOrigin(measureOrigin());
            setOpen(true);
            setVisibleKey((v) => v + 1); // slight nudge to re-render variants if needed
          }}
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none",
            boxShadow: 3,
          }}
        >
          <Typography variant="subtitle1">7</Typography>
        </Box>
      </Box>

      {/* Backdrop + Modal portal-ish (placed at root visually) */}
      <AnimatePresence>
        {open && (
          // Backdrop catches clicks to close
          <motion.div
            key={`backdrop-${visibleKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => outsideClose && setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // slightly dim the page behind
              background: "rgba(0,0,0,0.45)",
            }}
          >
            {/* stop propagation on modal so clicking modal doesn't close */}
            <motion.div
              onClick={(e) => e.stopPropagation()}
              custom={origin}
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                width: modalWidth,
                height: modalHeight,
                zIndex: 1401,
                willChange: "transform, opacity",
              }}
            >
              <Paper
                elevation={6}
                sx={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6">Modal Title</Typography>
                  <IconButton size="small" onClick={() => setOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
                  <Typography>
                    This modal popped out playfully from the badge. When you
                    click outside or press Esc, it will animate back into the
                    badge like it's being sucked in.
                  </Typography>

                  {/* sample content */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Add your real content here — form, list, details, etc.
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


