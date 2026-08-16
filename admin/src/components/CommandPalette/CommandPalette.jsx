import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, ShoppingBag, PlusCircle, Users, Activity } from 'lucide-react';
import './CommandPalette.css';

const CommandPalette = ({ open, setOpen }) => {
  const navigate = useNavigate();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu" className="cmdk-dialog dark:bg-dark-card dark:border-dark-border dark:text-gray-100">
      <div className="cmdk-input-wrapper">
        <Search className="cmdk-search-icon" />
        <Command.Input placeholder="Type a command or search..." className="cmdk-input dark:bg-dark-card dark:text-gray-100 placeholder:text-gray-400" />
      </div>
      <Command.List className="cmdk-list dark:bg-dark-card">
        <Command.Empty className="cmdk-empty dark:text-gray-400">No results found.</Command.Empty>

        <Command.Group heading="Navigation" className="dark:text-gray-300">
          <Command.Item onSelect={() => { navigate('/dashboard'); setOpen(false); }} className="cmdk-item dark:hover:bg-gray-800">
            <LayoutDashboard className="cmdk-icon" /> Dashboard
          </Command.Item>
          <Command.Item onSelect={() => { navigate('/orders'); setOpen(false); }} className="cmdk-item dark:hover:bg-gray-800">
            <ShoppingBag className="cmdk-icon" /> Orders
          </Command.Item>
          <Command.Item onSelect={() => { navigate('/add'); setOpen(false); }} className="cmdk-item dark:hover:bg-gray-800">
            <PlusCircle className="cmdk-icon" /> Add Items
          </Command.Item>
          <Command.Item onSelect={() => { navigate('/list'); setOpen(false); }} className="cmdk-item dark:hover:bg-gray-800">
            <Activity className="cmdk-icon" /> Menu List
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
};

export default CommandPalette;
