package com.neobit.crm;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class DemoController {

    @GetMapping("/tenant")
    public String getTenant() {
        return "Tenant: DemoCorp";
    }

    @PostMapping("/raise-issue")
    public String raiseIssue(@RequestBody String issue) {
        return "Issue received: " + issue;
    }

    @GetMapping("/call")
    public String makeCall(@RequestParam String to) {
        return "Calling " + to + "...";
    }
}
