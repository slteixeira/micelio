# micelio server config. Apply on the box once it arrives:
#   1. nixos-generate-config (keep its hardware-configuration.nix, don't touch it)
#   2. copy this file to /etc/nixos/configuration.nix
#   3. nixos-rebuild switch
#   4. tailscale up  (then approve in the admin console)
#
# Replace YOUR_SSH_PUBKEY_HERE before applying.

{ config, pkgs, ... }:

{
  imports = [ ./hardware-configuration.nix ];

  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  networking.hostName = "micelio";
  time.timeZone = "America/Sao_Paulo";

  # RAM headroom for traffic spikes without needing a bigger swapfile.
  zramSwap.enable = true;

  virtualisation.docker.enable = true;

  services.tailscale.enable = true;

  services.openssh = {
    enable = true;
    settings = {
      PasswordAuthentication = false;
      PermitRootLogin = "no";
    };
  };

  # Only reachable over the tailnet — no public ports. Serve publicly later
  # via `tailscale funnel` if/when needed instead of opening the firewall.
  networking.firewall.enable = true;
  networking.firewall.trustedInterfaces = [ "tailscale0" ];
  networking.firewall.allowedTCPPorts = [ ];

  users.users.micelio = {
    isNormalUser = true;
    extraGroups = [ "docker" "wheel" ];
    openssh.authorizedKeys.keys = [
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGATBQnPTu0IZVX7NnnrxSOz7YuDao0WooWm0lLITy40 micelio-server"
    ];
  };

  security.sudo.wheelNeedsPassword = false;

  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 14d";
  };

  system.stateVersion = "24.05";
}
