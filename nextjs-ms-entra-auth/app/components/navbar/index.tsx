import Link from "next/link";
import Image from "next/image";

async function Navbar() {
  return (
    <nav className="flex items-center justify-between gap-4 px-5 py-2">
      <div>
        <Link href={"/"} className="font-bold">
        <h1>BookMyGame</h1>
        </Link>
      </div>
        <ul className="flex items-center gap-4 flex-row">
          <li>
            <Link href={"/BookMyGame"}>BookMyGame</Link>
          </li>
          <li>
            <Link href={"/profile"}>Profile</Link>
          </li>
        </ul>
    </nav>
  );
}

export default Navbar;
