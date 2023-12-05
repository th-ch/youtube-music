require 'json'
require 'open-uri'

cask "youtube-music" do
  desc "YouTube Music Desktop App"
  homepage "https://github.com/th-ch/youtube-music"

  # Fetch the latest release version from GitHub API
  latest_release = JSON.parse(URI.open("https://api.github.com/repos/th-ch/youtube-music/releases/latest").read)['tag_name']
  version latest_release

  base_url = "https://github.com/th-ch/youtube-music/releases/download/#{latest_release}/YouTube-Music-#{latest_release.delete_prefix('v')}"
  file_extension = Hardware::CPU.arm? ? "-arm64.dmg" : ".dmg"
  url "#{base_url}#{file_extension}"

  # TODO checksum
  sha256 :no_check

  app "YouTube Music.app"

  postflight do
    print("Removing quarantine attribute from YouTube Music.app.\n")
    system "xattr -cr '/Applications/YouTube Music.app'"
  end

  auto_updates true

end
