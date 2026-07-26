import Swal from "sweetalert2"

// Detect dark mode from the <html> class set by next-themes.
function isDark(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.classList.contains("dark")
}

function baseConfig() {
  const dark = isDark()
  return {
    background: dark ? "#1e3a5f" : "#ffffff",
    color: dark ? "#f0f7ff" : "#0a1628",
    confirmButtonColor: "#1e3a5f",
    cancelButtonColor: "#dc2626",
    iconColor: dark ? "#87ceeb" : "#1e3a5f",
  }
}

export const confirmDelete = (message = "Cette action est irréversible.") =>
  Swal.fire({
    ...baseConfig(),
    title: "Êtes-vous sûr ?",
    text: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Oui, supprimer",
    cancelButtonText: "Annuler",
    reverseButtons: true,
    focusCancel: true,
  }).then((res) => res.isConfirmed)

export const successAlert = (title: string, text?: string) =>
  Swal.fire({
    ...baseConfig(),
    title,
    text,
    icon: "success",
    confirmButtonText: "OK",
    timer: 2500,
    timerProgressBar: true,
  })

export const errorAlert = (title: string, text?: string) =>
  Swal.fire({
    ...baseConfig(),
    title,
    text,
    icon: "error",
    confirmButtonText: "OK",
  })

export const infoAlert = (title: string, text?: string) =>
  Swal.fire({
    ...baseConfig(),
    title,
    text,
    icon: "info",
    confirmButtonText: "OK",
  })
