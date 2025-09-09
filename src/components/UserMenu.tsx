import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaUser,
  FaShoppingCart,
  FaHeart,
  FaPhone,
  FaRegUser,
} from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GoPerson } from "react-icons/go";
import { logoutApi } from "@/lib/features/auth";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FiUser } from "react-icons/fi";
import { LucideUserRound } from "lucide-react";

const UserMenu = ({ setIsSheetOpen }) => {
  const [open, setOpen] = useState(false);
  const token = useSelector((state: any) => state.auth.token);
  const dispatch = useDispatch<any>();
  const router = useRouter();

  const handleItemClick = () => {
    setOpen(false);
    setIsSheetOpen(false);
  };

  const handleLogout = async () => {
    const { payload }: any = await dispatch(logoutApi());
    if (payload.success) {
      toast.success("Logout Success");
      router.push("/");
    } else {
      toast.error(payload.msg);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          title="User"
          variant="ghost"
          size="icon"
          className="relative text-navbarText hover:text-navbarHover hover:bg-transparent "
          style={{ zIndex: 99999 }}
        >
          <LucideUserRound
            size={30}
            className=" text-[#eab565] cursor-pointer"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 z-[1000] bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        align="end"
        style={{ zIndex: 99999 }}
      >
        {token ? (
          <>
            <Link href="/profile" passHref>
              <DropdownMenuItem
                onClick={handleItemClick}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-yellow-100 cursor-pointer"
                style={{ zIndex: 99999 }}
              >
                <FaUser className="mr-2" /> My Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/orders" passHref>
              <DropdownMenuItem
                onClick={handleItemClick}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-yellow-100 cursor-pointer"
              >
                <FaShoppingCart className="mr-2" /> Orders
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="my-1 border-t border-gray-100" />
          </>
        ) : (
          <Link href="/login" passHref>
            <DropdownMenuItem
              onClick={handleItemClick}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-yellow-100 cursor-pointer"
            >
              <FaUser className="mr-2" /> Login
            </DropdownMenuItem>
          </Link>
        )}
        <DropdownMenuSeparator className="my-1 border-t border-gray-100" />
        <Link href="/cart" passHref>
          <DropdownMenuItem
            onClick={handleItemClick}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-yellow-100 cursor-pointer"
          >
            <FaShoppingCart className="mr-2" /> Cart
          </DropdownMenuItem>
        </Link>
        <Link href="/wishlist" passHref>
          <DropdownMenuItem
            onClick={handleItemClick}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-yellow-100 cursor-pointer"
          >
            <FaHeart className="mr-2" /> Wishlist
          </DropdownMenuItem>
        </Link>
        <Link href="/contact" passHref>
          <DropdownMenuItem
            onClick={handleItemClick}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-yellow-100 cursor-pointer"
          >
            <FaPhone className="mr-2" /> Contact Us
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator className="my-1 border-t border-gray-100" />
        {token && (
          <DropdownMenuItem
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-100 cursor-pointer"
          >
            Logout
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
