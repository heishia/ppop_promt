import logo from "figma:asset/9691070d5364bd274e1d523d98d55d1f6ea24cad.png";

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-white flex items-center px-6">
      <div className="flex items-center gap-2">
        <img src={logo} alt="PPOP_Promt logo" className="w-10 h-10 object-contain rounded-lg" />
      </div>
    </header>
  );
}