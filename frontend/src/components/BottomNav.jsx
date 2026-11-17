import { NavLink } from "react-router-dom";
import { HeartIcon, HomeIcon, SearchIcon, UserIcon } from "./Icons";
import { tap } from "../sound";

export default function BottomNav() {
  return (
    <nav className="nav" aria-label="Asosiy">
      <NavLink to="/" end data-sound="tab" onClick={() => tap("tab")}>
        <HomeIcon />
        Bosh sahifa
      </NavLink>
      <NavLink to="/search" data-sound="tab" onClick={() => tap("tab")}>
        <SearchIcon />
        Qidiruv
      </NavLink>
      <NavLink to="/favorites" data-sound="tab" onClick={() => tap("tab")}>
        <HeartIcon />
        Sevimlilar
      </NavLink>
      <NavLink to="/profile" data-sound="tab" onClick={() => tap("tab")}>
        <UserIcon />
        Profil
      </NavLink>
    </nav>
  );
}
